"use client"; // This page uses client-side auth check

import React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Footer } from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, Send, Settings, MessageSquareText, FileText, Sparkles, AlertTriangle, ThumbsUp, HelpCircle, Users, Truck, Briefcase } from 'lucide-react';
import { generateQuestionsAction, summarizeFeedbackAction } from '@/lib/actions';
import { DEFAULT_CORE_VALUES, DEFAULT_QUALITY_SUBSETS, FEEDBACK_CATEGORIES, NUM_QUESTIONS_FOR_CHATBOT_PREVIEW, MIN_QUESTIONS_TO_GENERATE, MAX_QUESTIONS_TO_GENERATE } from '@/config/site';
import type { FeedbackCategory } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import Firestore functions
import { doc, setDoc, getDoc } from "firebase/firestore";
import db from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [coreValues, setCoreValues] = useState(DEFAULT_CORE_VALUES);
  const [qualitySubsets, setQualitySubsets] = useState(DEFAULT_QUALITY_SUBSETS);
  const [aiAssistantTraining, setAiAssistantTraining] = useState("");
  
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isGeneratingQs, setIsGeneratingQs] = useState(false);
  const [selectedCategoryForQs, setSelectedCategoryForQs] = useState<FeedbackCategory | undefined>(FEEDBACK_CATEGORIES[0]);
  const [numQuestionsPreview, setNumQuestionsPreview] = useState<number>(NUM_QUESTIONS_FOR_CHATBOT_PREVIEW);

  const [feedbacks, setFeedbacks] = useState<any[]>([]); // State to hold fetched feedback data
  const [isSummarizing, setIsSummarizing] = useState<{[key: string]: boolean}>({});


  useEffect(() => {
    // Simple client-side auth check
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Fetch existing configuration from Firestore on mount
      fetchConfig();
      // Fetch customer feedback from Firestore
      fetchFeedbacks();
    }
  }, [router]);

  // Function to fetch feedback data from Firestore
  const fetchFeedbacks = async () => {
    const feedbackCollectionRef = collection(db, "feedbacks");
    try {
      const querySnapshot = await getDocs(feedbackCollectionRef);
      const fetchedFeedbacks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any, // Cast to any for now, refine type later
        // Ensure timestamp is converted to Date object if needed
        submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : doc.data().submittedAt,
      }));
      setFeedbacks(fetchedFeedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast({ 
        title: "Feedback Fetch Error", 
        description: "Could not fetch customer feedback.", 
        variant: "destructive" 
      });
    }
  };

  const fetchConfig = async () => {
    const configRef = doc(db, "settings", "aiConfig");
    try {
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setCoreValues(data.coreValues || DEFAULT_CORE_VALUES);
        setQualitySubsets(data.qualitySubsets || DEFAULT_QUALITY_SUBSETS);
      } else {
        // If no config exists, use default values
        setCoreValues(DEFAULT_CORE_VALUES);
        setQualitySubsets(DEFAULT_QUALITY_SUBSETS);
        // Optionally save the default config
        try {
          await setDoc(configRef, {
            coreValues: DEFAULT_CORE_VALUES,
            qualitySubsets: DEFAULT_QUALITY_SUBSETS,
          });
        } catch (error) {
          console.error("Error saving default configuration:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching configuration:", error);
      // Use default values if fetch fails
      setCoreValues(DEFAULT_CORE_VALUES);
      setQualitySubsets(DEFAULT_QUALITY_SUBSETS);
      toast({ 
        title: "Configuration Error", 
        description: "Could not fetch configuration. Using default values.", 
        variant: "destructive" 
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/admin/login');
  };

  const handleSaveChanges = async () => {
    startTransition(async () => {
      const configRef = doc(db, "settings", "aiConfig");
      try {
        await setDoc(configRef, {
          coreValues: coreValues,
          qualitySubsets: qualitySubsets,
          // Add other config fields here if needed
        });
        toast({ title: "Settings Saved", description: "Configuration saved to Firebase!", icon: <ThumbsUp className="h-5 w-5 text-green-500" /> });
      } catch (error) {
        console.error("Error saving configuration:", error);
        toast({ title: "Save Failed", description: "Could not save configuration.", variant: "destructive" });
      }
    });
  };
  
  const handleSummarizeFeedback = async (feedbackId: string, feedbackText: string, category: FeedbackCategory) => {
    setIsSummarizing(prev => ({...prev, [feedbackId]: true}));
    startTransition(async () => {
      try {
        const result = await summarizeFeedbackAction(feedbackText, category);
        setFeedbacks(currentFeedbacks => 
          currentFeedbacks.map(fb => fb.id === feedbackId ? {...fb, summary: result.summary} : fb)
        );
        if (result.summary && !result.summary.startsWith("Failed to generate summary")) {
            toast({ title: "Summary Generated", description: `AI summary created for feedback ID: ${feedbackId}.`, icon: <Sparkles className="h-5 w-5 text-accent" /> });
        } else {
            toast({ title: "Summary Generation Issue", description: result.summary || "Could not generate summary.", variant: "destructive", icon: <AlertTriangle className="h-5 w-5" /> });
        }
      } catch (error) {
        toast({ title: "Error Generating Summary", description: String(error), variant: "destructive" });
      } finally {
        setIsSummarizing(prev => ({...prev, [feedbackId]: false}));
      }
    });
  };
  
  // Add function to save generated questions
  const saveGeneratedQuestions = async (category: FeedbackCategory, questions: string[]) => {
    const questionsRef = doc(db, "settings", "pregeneratedQuestions");
    try {
      // Use merge: true to update only the specific category's questions, preserving others
      await setDoc(questionsRef, { [category]: questions }, { merge: true });
      toast({ title: "Questions Saved", description: `Generated questions for '${category}' saved successfully.`, icon: <ThumbsUp className="h-5 w-5 text-green-500" /> });
    } catch (error) {
      console.error("Error saving generated questions:", error);
      toast({ title: "Save Questions Failed", description: `Could not save generated questions for '${category}'.`, variant: "destructive" });
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCategoryForQs) {
        toast({ title: "Category Missing", description: "Please select a category first.", variant: "destructive" });
        return;
      }
    setIsGeneratingQs(true);
     // In a real app, you would fetch the latest config from Firestore here
     // For now, we'll use the state which should be synced from Firestore on mount
    startTransition(async () => {
      try {
        const result = await generateQuestionsAction(
          selectedCategoryForQs,
          coreValues, // Use state which is synced with Firestore
          qualitySubsets, // Use state which is synced with Firestore
          numQuestionsPreview
          );
         if (result.questions && result.questions.length > 0 && !result.questions[0].startsWith("Failed to generate questions")) {
            setGeneratedQuestions(result.questions);
            console.log("Generated questions array before saving:", result.questions);
            // Save the generated questions
            await saveGeneratedQuestions(selectedCategoryForQs, result.questions);
         } else {
            setGeneratedQuestions([result.questions?.[0] || "Failed to generate questions."]);
             toast({ title: "Question Generation Issue", description: result.questions?.[0] || "Could not generate questions.", variant: "destructive" });
         }
      } catch (error) {
         console.error("Error generating questions:", error);
         setGeneratedQuestions(["Error generating questions."]);
         toast({ title: "Error Generating Questions", description: String(error), variant: "destructive" });
      } finally {
        setIsGeneratingQs(false);
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  const trainingExamples = [
    "Example 1: When a customer mentions 'slow response times' for Delivery, ask 'Could you provide more details about which part of the delivery process felt slow?'",
    "Example 2: If feedback for Leadership includes 'lack of clarity', ask 'Can you give an example of a situation where you felt leadership communication could have been clearer?'"
  ];


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout} disabled={isPending}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Settings & AI Training */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl"><Settings className="mr-2 h-5 w-5 text-primary" /> System Configuration</CardTitle>
                  <CardDescription>Manage core values and quality subsets that guide AI question generation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="coreValues" className="font-semibold">Core Values</Label>
                    <Textarea id="coreValues" value={coreValues} onChange={(e) => setCoreValues(e.target.value)} placeholder="e.g., Integrity, Customer Focus, Innovation" className="min-h-[100px]" disabled={isPending} />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated list of core values.</p>
                  </div>
                  <div>
                    <Label htmlFor="qualitySubsets" className="font-semibold">Quality Subsets</Label>
                    <Textarea id="qualitySubsets" value={qualitySubsets} onChange={(e) => setQualitySubsets(e.target.value)} placeholder="e.g., Product Quality, Service Speed, Communication" className="min-h-[100px]" disabled={isPending} />
                     <p className="text-xs text-muted-foreground mt-1">Comma-separated list of quality-focused areas.</p>
                  </div>
                   <Button onClick={handleSaveChanges} disabled={isPending} className="w-full">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />} Save Configuration
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl"><Sparkles className="mr-2 h-5 w-5 text-accent" /> AI Assistant Training</CardTitle>
                  <CardDescription>Input examples to improve AI question generation. (Simulated)</CardDescription>
                </CardHeader>
                <CardContent>
                   <Label htmlFor="aiTrainingData" className="font-semibold">Training Data Examples</Label>
                  <Textarea id="aiTrainingData" value={aiAssistantTraining} onChange={(e) => setAiAssistantTraining(e.target.value)} placeholder="Enter training examples, one per line..." className="min-h-[120px]" disabled={isPending} />
                  <p className="text-xs text-muted-foreground mt-1">Provide examples of feedback and desired follow-up questions.</p>
                   <Accordion type="single" collapsible className="w-full mt-3">
                    <AccordionItem value="suggested-examples">
                      <AccordionTrigger className="text-sm">Show Suggested Training Examples</AccordionTrigger>
                      <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                        {trainingExamples.map((ex, i) => <p key={i}>{ex}</p>)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Question Generation & Feedback Viewing */}
            <div className="lg:col-span-1 space-y-6">
               <Card className="shadow-lg">
                <CardHeader>
                   <CardTitle className="flex items-center text-xl"><MessageSquareText className="mr-2 h-5 w-5 text-primary" /> Question Generation Preview</CardTitle>
                  <CardDescription>Preview AI-generated questions based on current configuration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="questionCategory">Select Category for Questions</Label>
                      <Select 
                        value={selectedCategoryForQs} 
                        onValueChange={(value: FeedbackCategory) => setSelectedCategoryForQs(value)} 
                        disabled={isPending || isGeneratingQs}
                        >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {FEEDBACK_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center">
                                {categoryIcons[category] && React.cloneElement(categoryIcons[category], { className: "mr-2 h-4 w-4 text-primary" })}
                                {category}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                  <div>
                      <Label htmlFor="numQuestionsPreview" className="font-semibold">Number of Questions (Preview)</Label>
                      <Input 
                        id="numQuestionsPreview" 
                        type="number" 
                        value={numQuestionsPreview} 
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const parsedValue = parseInt(inputValue, 10);
                          if (!isNaN(parsedValue)) {
                            setNumQuestionsPreview(parsedValue);
                          } else {
                            // If parsing results in NaN (e.g., empty string, or "abc")
                            // set to a default valid number to avoid passing NaN to the input's value prop.
                            setNumQuestionsPreview(NUM_QUESTIONS_FOR_CHATBOT_PREVIEW);
                          }
                        }}
                        min={MIN_QUESTIONS_TO_GENERATE}
                        max={MAX_QUESTIONS_TO_GENERATE}
                        className="w-full"
                        disabled={isPending || isGeneratingQs}
                      />
                       <p className="text-xs text-muted-foreground mt-1">Enter {MIN_QUESTIONS_TO_GENERATE}-{MAX_QUESTIONS_TO_GENERATE}. Used for this preview.</p>
                    </div>
                  <Button onClick={handleGenerateQuestions} disabled={isPending || isGeneratingQs || !selectedCategoryForQs} className="w-full">
                    {(isPending || isGeneratingQs) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Generate Preview Questions
                  </Button>
                  {generatedQuestions.length > 0 && (
                    <div className="mt-4 p-4 border rounded-md bg-secondary">
                        <h4 className="font-semibold text-md mb-2 text-primary">Generated Questions:</h4>
                        <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                            {generatedQuestions.map((q, index) => (
                                <li key={index}>{q}</li>
                            ))}
                        </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

               <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> View Customer Feedback</CardTitle>
                  <CardDescription>Review submitted feedback and generate AI summaries.</CardDescription>
                </CardHeader>
                <CardContent>
                   {/* Loading state */}
                   {isPending ? (
                     <div className="flex items-center justify-center py-6 text-muted-foreground">
                         <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                         Loading feedback...
                     </div>
                   ) : feedbacks.length === 0 ? (
                     // No feedback state
                     <p className="text-muted-foreground">No feedback submitted yet.</p>
                   ) : (
                     // Display feedback list
                     <Accordion type="multiple" className="w-full space-y-3">
                       {feedbacks.map((fb) => (
                         <AccordionItem value={fb.id} key={fb.id} className="border rounded-md px-4 bg-background">
                           <AccordionTrigger className="hover:no-underline">
                             <div className="flex justify-between w-full items-center">
                               <span>{fb.name || 'Anonymous'} - <span className="font-normal text-muted-foreground">{fb.category}</span></span>
                               <span className="text-xs text-muted-foreground">{fb.submittedAt?.toLocaleDateString ? fb.submittedAt.toLocaleDateString() : 'N/A'}</span>
                             </div>
                           </AccordionTrigger>
                           <AccordionContent className="pt-2">
                              {fb.email && <p className="text-sm text-foreground mb-2"><strong>Email:</strong> {fb.email}</p>}
                              {/* Displaying answers from the array */}
                              {fb.answers && Array.isArray(fb.answers) && fb.answers.length > 0 ? (
                                <div className="mb-3">
                                  <p className="font-semibold text-sm mb-1">Answers:</p>
                                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                    {fb.answers.map((item: any, ansIndex: number) => (
                                      <li key={ansIndex}><strong>{item.questionText || 'Question'}:</strong> {item.answer || 'No answer'}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : fb.rawText ? (
                                 <p className="text-sm text-foreground whitespace-pre-wrap mb-3"><strong>Feedback:</strong> {fb.rawText}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground mb-3">No detailed feedback provided.</p>
                              )}
                              
                              {fb.summary && ( // Show summary if it exists
                               <div className="mt-2 p-3 border rounded-md bg-secondary">
                                 <p className="font-semibold text-sm flex items-center"><Sparkles className="h-4 w-4 mr-1.5 text-accent" />AI Summary:</p>
                                 <p className="text-xs text-muted-foreground whitespace-pre-wrap">{fb.summary}</p>
                               </div>
                             )}

                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-3"
                              onClick={() => handleSummarizeFeedback(fb.id, fb.rawText || fb.answers?.map((a: any) => a.answer).join('\n') || '', fb.category as FeedbackCategory)} // Pass rawText or joined answers
                              disabled={isPending || isSummarizing[fb.id]}
                            >
                              {(isPending || isSummarizing[fb.id]) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                              {fb.summary ? "Regenerate Summary" : "Generate AI Summary"}
                            </Button>
                           </AccordionContent>
                         </AccordionItem>
                       ))}
                     </Accordion>
                   )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const categoryIcons: {[key in FeedbackCategory]: JSX.Element} = {
  Leadership: <Users className="mr-2 h-5 w-5 text-primary" />,
  Delivery: <Truck className="mr-2 h-5 w-5 text-primary" />,
  "Vendor Management": <Briefcase className="mr-2 h-5 w-5 text-primary" />,
};

