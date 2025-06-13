declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly interpretation: any;
    readonly emma: Document | null;
  }

  // Add SpeechRecognitionErrorCode definition
  type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  // Removed declare var as it's not needed in declare global
  // declare var SpeechRecognition: { new(): SpeechRecognition; prototype: SpeechRecognition; };
  // declare var webkitSpeechRecognition: { new(): SpeechRecognition; prototype: SpeechRecognition; };
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FEEDBACK_CATEGORIES, DEFAULT_CORE_VALUES, DEFAULT_QUALITY_SUBSETS, NUM_QUESTIONS_FOR_LIVE_CHATBOT } from "@/config/site";
import type { FeedbackCategory } from "@/lib/types";
import { summarizeFeedbackAction } from "@/lib/actions";
import { Loader2, Mic, Send, Users, Truck, Briefcase, Bot, UserCircle, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import Firestore functions
import { doc, getDoc, collection, addDoc, Timestamp, setDoc } from "firebase/firestore";
import db from "@/lib/firebase"; // Correct default import for Firestore instance

const feedbackUserDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  email: z.string().email("Invalid email address."),
  category: z.enum(FEEDBACK_CATEGORIES, {
    required_error: "Please select a feedback category.",
  }),
});

type FeedbackUserDetailsValues = z.infer<typeof feedbackUserDetailsSchema>;

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  questionId?: string; // Original question ID if this is an answer
}

interface CollectedAnswer {
  questionId: string;
  questionText: string;
  answer: string;
}

export function FeedbackForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestions, setCurrentQuestions] = useState<{ id: string; text: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [collectedAnswers, setCollectedAnswers] = useState<CollectedAnswer[]>([]);
  const [isChatActive, setIsChatActive] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [feedbackDocId, setFeedbackDocId] = useState<string | null>(null); // State to hold the ID of the saved feedback document

  // State to hold fetched configuration
  const [aiConfig, setAiConfig] = useState({
    coreValues: DEFAULT_CORE_VALUES,
    qualitySubsets: DEFAULT_QUALITY_SUBSETS,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const initialMessageAddedRef = useRef(false);

  const form = useForm<FeedbackUserDetailsValues>({
    resolver: zodResolver(feedbackUserDetailsSchema),
    defaultValues: {
      name: "",
      email: "",
      category: undefined,
    },
  });

  const selectedCategory = form.watch("category");

  const addMessage = useCallback((sender: 'user' | 'assistant', content: string, questionId?: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      questionId,
    }]);
  }, []);

  useEffect(() => {
    // Fetch initial configuration on mount
    fetchConfig();
  }, [addMessage]);

  // Fetch configuration from Firestore
  const fetchConfig = async () => {
    const configRef = doc(db, "settings", "aiConfig");
    try {
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setAiConfig({
          coreValues: data.coreValues || DEFAULT_CORE_VALUES,
          qualitySubsets: data.qualitySubsets || DEFAULT_QUALITY_SUBSETS,
        });
      } else {
        // If no config exists, use default values already set in useState
      }
    } catch (error) {
      console.error("Error fetching configuration:", error);
      toast({ title: "Error", description: "Could not fetch AI configuration.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setUserInput(transcript);
          setIsRecording(false);
          // Consider auto-sending or focusing input for edit
        };
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          toast({ title: "Voice Error", description: `Speech recognition error: ${event.error}`, variant: "destructive"});
        };
        recognitionRef.current.onend = () => setIsRecording(false);
      }
    }
  }, [toast]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ title: "Unsupported", description: "Voice input is not supported by your browser.", variant: "destructive" });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        setUserInput(""); // Clear input before recording
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ title: "Voice Error", description: "Could not start voice input.", variant: "destructive" });
      }
    }
  };

  const askNextQuestion = useCallback(() => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      const nextQIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQIndex);
      addMessage('assistant', currentQuestions[nextQIndex].text);
    } else {
      addMessage('assistant', "Thank you for your answers! We are processing your feedback.");
      setAllQuestionsAnswered(true);
      setIsChatActive(false); // Disable further input
      
      // Trigger feedback saving and then summary generation
      startTransition(async () => {
        const { name, email, category } = form.getValues();
        if (!category) {
          toast({ title: "Error", description: "Category not selected.", variant: "destructive"});
          return;
        }

        // Prepare feedback data for saving
        const feedbackData = {
          name: name || 'Anonymous', // Use Anonymous if name is not provided
          email: email || 'N/A', // Use N/A if email is not provided
          category: category,
          answers: collectedAnswers, // Save the structured answers array
          submittedAt: Timestamp.now(), // Use server timestamp
          summary: null, // Initialize summary as null
        };

        try {
          // Save feedback to Firestore
          const docRef = await addDoc(collection(db, "feedbacks"), feedbackData);
          setFeedbackDocId(docRef.id); // Store the new document ID
          addMessage('assistant', "Your feedback has been recorded. Generating summary...");

          // Now generate summary for the saved feedback
          const feedbackTextForSummary = collectedAnswers.map(a => `Q: ${a.questionText}\nA: ${a.answer}`).join('\n\n');
          const summaryResult = await summarizeFeedbackAction(feedbackTextForSummary, category);
          const generatedSummary = summaryResult.summary;
          setSummary(generatedSummary);

          // Update the saved feedback document with the summary
          if (docRef.id) {
             await setDoc(doc(db, "feedbacks", docRef.id), { summary: generatedSummary }, { merge: true });
          }

          if (generatedSummary && !generatedSummary.startsWith("Failed to generate summary")) {
            addMessage('assistant', `Here's a summary of your feedback:\n${generatedSummary}`);
            addMessage('assistant', `Thank you, ${name || 'Anonymous'}, for your valuable feedback! It has been submitted and summarized.`);
            toast({
                title: "Feedback Submitted!",
                description: "Thank you for helping us improve. Summary generated.",
                icon: <Sparkles className="h-5 w-5 text-accent" />
            });
          } else {
            addMessage('assistant', "Sorry, we couldn't generate a summary at this time. Your feedback has been recorded.");
            addMessage('assistant', `Thank you, ${name || 'Anonymous'}, for your valuable feedback! It has been submitted (summary failed).`);
            toast({ title: "Feedback Submitted (Summary Failed)", description: generatedSummary || "Could not generate summary.", variant: "destructive", icon: <AlertTriangle className="h-5 w-5" /> });
          }

        } catch (error) {
          console.error("Error saving or summarizing feedback:", error);
          addMessage('assistant', "Sorry, we encountered an error processing your feedback. Your answers have been recorded but summary failed.");
          toast({ title: "Submission Error", description: "Failed to save feedback or generate summary.", variant: "destructive" });
           // Clean up the possibly partially created document if saving failed after addDoc but before summary update
           if (feedbackDocId) {
             // Consider adding a mechanism to clean up partial docs or handle this in admin view
             console.warn("Feedback document created but summary update failed:", feedbackDocId);
           }
        }
      });
    }
  }, [currentQuestionIndex, currentQuestions, addMessage, collectedAnswers, form, toast, feedbackDocId]); // Added feedbackDocId to dependencies

  // Fetch pre-generated questions from Firestore
  const fetchPregeneratedQuestions = useCallback(async (category: FeedbackCategory) => {
    setIsGeneratingQuestions(true);
    const questionsRef = doc(db, "settings", "pregeneratedQuestions");
    try {
      const docSnap = await getDoc(questionsRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const questions = data[category] as string[] | undefined;
        if (questions && questions.length > 0) {
          const newQuestions = questions.map((q, index) => ({ id: `q-${index}-${Date.now()}`, text: q }));
          return newQuestions; // Return fetched questions
        } else {
          return []; // Return empty array if no questions found
        }
      } else {
        return []; // Return empty array if document doesn't exist
      }
    } catch (error) {
      console.error("Error fetching pre-generated questions:", error);
      toast({ title: "Error Loading Questions", description: String(error), variant: "destructive" });
      return []; // Return empty array on error
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [toast]);

  // Dedicated function to handle category change and chat reset
  const handleCategoryChange = useCallback(async (category: FeedbackCategory) => {
    // Reset chat state completely
    setCurrentQuestions([]);
    setCurrentQuestionIndex(-1);
    setCollectedAnswers([]);
    setAllQuestionsAnswered(false);
    setSummary(null);

    // Always start with the welcome message
    const initialMessages: ChatMessage[] = [{
      id: 'welcome-msg',
      sender: 'assistant',
      content: "Welcome! Please fill in your details and select a feedback category to begin.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    }];

    // Fetch questions for the new category
    const fetchedQuestions = await fetchPregeneratedQuestions(category);

    if (fetchedQuestions.length > 0) {
      // Add the first question after the welcome message
      initialMessages.push({
        id: fetchedQuestions[0].id,
        sender: 'assistant',
        content: fetchedQuestions[0].text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      });
      setCurrentQuestions(fetchedQuestions);
      setCurrentQuestionIndex(0); // Set index to 0 (the first question) - although the first question is already added, this state is for subsequent questions
      setIsChatActive(true);
    } else {
      // If no questions found, add a message indicating that
      const message = `No pre-generated questions found for '${category}'. You can share general feedback if you'd like. Type 'done' when finished or select another category.`;
      initialMessages.push({
         id: 'no-questions-msg',
         sender: 'assistant',
         content: message,
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      });
      setCurrentQuestions([]); // Ensure questions array is empty
      setCurrentQuestionIndex(-1); // Ensure index is -1
      setIsChatActive(true); // Still activate chat to allow general feedback
      toast({ title: "Questions Not Found", description: message, variant: "default" });
    }

    // Set the messages state with the constructed initial messages
    setMessages(initialMessages);

 }, [fetchPregeneratedQuestions, toast]);

  // Effect to handle category selection and chat activation
  useEffect(() => {
    // This effect will now primarily manage chat active state based on category
    // Question fetching is triggered by handleCategoryChange
    if (selectedCategory) {
       // Call the dedicated category change handler
       handleCategoryChange(selectedCategory as FeedbackCategory);
    } else if (!selectedCategory && isChatActive) {
       // If category is deselected while chat was active, deactivate chat
       setIsChatActive(false);
       // Optionally reset messages or add a message indicating category deselection
       // addMessage('assistant', "Category deselected. Please select a new one to continue.");
       // Reset messages and state (handled by handleCategoryChange when re-selecting)
       // Clear messages completely when category is deselected
        setMessages([]);
        setCurrentQuestions([]);
        setCurrentQuestionIndex(-1);
        setCollectedAnswers([]);
        setAllQuestionsAnswered(false);
        setSummary(null);
    }
  }, [selectedCategory, isChatActive, handleCategoryChange]); // Add handleCategoryChange as a dependency

  const handleSendMessage = () => {
    if (!userInput.trim() || !isChatActive) return;

    const currentQ = currentQuestions[currentQuestionIndex];
    addMessage('user', userInput, currentQ?.id);
    
    if (currentQ) {
      setCollectedAnswers(prev => [...prev, { questionId: currentQ.id, questionText: currentQ.text, answer: userInput }]);
    } else if (userInput.trim().toLowerCase() === 'done' && currentQuestions.length === 0) {
        // Handling general feedback submission if no questions were loaded
        addMessage('assistant', "Thank you for your general feedback!");
        setAllQuestionsAnswered(true); // Treat as if all questions answered
        setIsChatActive(false);
        // Trigger saving for general feedback
        startTransition(async () => {
          const { name, email, category } = form.getValues();
          // For general feedback, answers array will be empty. Can save rawText if needed, but currently not collected.
          // If you want to save general feedback text, you'd need a state variable for it.
          // For now, saving basic info + empty answers array.
          const feedbackData = {
            name: name || 'Anonymous',
            email: email || 'N/A',
            category: category || 'General', // Use General category for general feedback
            answers: [], // Empty answers array for general feedback
            rawText: userInput, // Save the general feedback text
            submittedAt: Timestamp.now(),
            summary: null,
          };
          try {
            await addDoc(collection(db, "feedbacks"), feedbackData);
            addMessage('assistant', `Thank you, ${name || 'Anonymous'}, for your valuable feedback! It has been submitted.`);
             toast({
                 title: "Feedback Submitted!",
                 description: "Thank you for helping us improve.",
                 icon: <Sparkles className="h-5 w-5 text-accent" />
             });
          } catch (error) {
            console.error("Error saving general feedback:", error);
            addMessage('assistant', "Sorry, we encountered an error saving your feedback.");
            toast({ title: "Submission Error", description: "Failed to save general feedback.", variant: "destructive" });
          }
        });
        return;
    }


    setUserInput("");
    askNextQuestion();
  };
  
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // This function is for the main form user details.
  function onUserDetailsSubmit(_data: FeedbackUserDetailsValues) {
     // This function is called when category is selected (due to onValueChange logic)
     // or if user tries to submit without category (though Select will likely prevent this).
     // Form validation for name, email, category happens here via resolver.
     // If valid, we activate the chat.
     if (!selectedCategory) {
        toast({title: "Error", description: "Please select a category.", variant: "destructive"});
        return;
     }
     // If details are valid and category selected, activate chat.
     // The useEffect for [selectedCategory, isChatActive] will then trigger question loading.
     if (!isChatActive) { // Prevent re-triggering if already active
        setIsChatActive(true); 
        // Clear previous chat messages except for the initial welcome message
        setMessages(prev => prev.filter(m => m.content.startsWith("Welcome!")));
        setCurrentQuestions([]);
        setCurrentQuestionIndex(-1);
     }
  }
  
  const categoryIcons = {
    Leadership: <Users className="mr-2 h-5 w-5 text-primary" />,
    Delivery: <Truck className="mr-2 h-5 w-5 text-primary" />,
    "Vendor Management": <Briefcase className="mr-2 h-5 w-5 text-primary" />,
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onUserDetailsSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Your Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your name" 
                    {...field} 
                    disabled={isChatActive || allQuestionsAnswered || isGeneratingQuestions}
                    className="w-full h-10 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    {...field} 
                    disabled={isChatActive || allQuestionsAnswered || isGeneratingQuestions}
                    className="w-full h-10 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Category</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // Form validation is still triggered, but chat reset/question loading is now in useEffect
                  form.trigger(["name", "email", "category"]);
                }} 
                defaultValue={field.value}
                disabled={allQuestionsAnswered || isGeneratingQuestions} 
                // Removed isChatActive from disabled here to allow category change mid-chat, handled by onValueChange
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                       <div className="flex items-center">
                        {categoryIcons[category]}
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(isGeneratingQuestions || (isChatActive && currentQuestions.length === 0 && !allQuestionsAnswered && selectedCategory && currentQuestionIndex === -1)) && (
             <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                {isGeneratingQuestions ? "Loading questions..." : (selectedCategory ? "Preparing chat..." : "Select category and fill details to start.")}
            </div>
        )}

        <ScrollArea className="h-80 w-full rounded-md border p-4 bg-secondary/30" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] p-3 rounded-lg shadow-sm",
                  msg.sender === 'assistant' ? "bg-card self-start items-start" : "bg-primary text-primary-foreground self-end items-end"
                )}
              >
                <div className="flex items-center mb-1">
                  {msg.sender === 'assistant' ? <Bot className="h-5 w-5 mr-2 text-primary" /> : <UserCircle className="h-5 w-5 mr-2 text-primary-foreground" />}
                  <span className="font-semibold text-sm">{msg.sender === 'assistant' ? "Assistant" : form.getValues().name || "You"}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className={cn("text-xs mt-1", msg.sender === 'assistant' ? "text-muted-foreground self-start" : "text-primary-foreground/80 self-end")}>{msg.timestamp}</span>
              </div>
            ))}
             {isPending && allQuestionsAnswered && ( // Show loading for summary
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                    Generating summary...
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={isChatActive && !isGeneratingQuestions && currentQuestions.length > 0 ? "Type your response..." : (allQuestionsAnswered ? "Feedback session complete." : "Fill details and select category to start chat.")}
            className="flex-1 resize-none"
            rows={1}
            disabled={!isChatActive || isPending || isRecording || allQuestionsAnswered || isGeneratingQuestions || (currentQuestions.length === 0 && currentQuestionIndex === -1 && !isGeneratingQuestions)}
          />
          <Button 
            type="button" 
            onClick={handleMicClick} 
            size="icon" 
            variant="outline" 
            disabled={!isChatActive || isPending || allQuestionsAnswered || isGeneratingQuestions || (currentQuestions.length === 0 && currentQuestionIndex === -1 && !isGeneratingQuestions)}
            className={cn(isRecording ? "animate-pulse border-destructive text-destructive" : "")}
            aria-label="Use microphone"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button 
            type="button" 
            onClick={handleSendMessage} 
            disabled={!isChatActive || isPending || !userInput.trim() || isRecording || allQuestionsAnswered || isGeneratingQuestions || (currentQuestions.length === 0 && currentQuestionIndex === -1 && !isGeneratingQuestions)}
            aria-label="Send message"
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {summary && allQuestionsAnswered && (
            <div className="mt-4 p-4 border rounded-md bg-secondary">
                <h3 className="font-semibold text-lg mb-2 text-primary flex items-center"><Sparkles className="h-5 w-5 mr-2 text-accent" />Feedback Summary</h3>
                <p className="text-sm whitespace-pre-wrap text-foreground">{summary}</p>
            </div>
        )}
      </form>
    </Form>
  );
}
