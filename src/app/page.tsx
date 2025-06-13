import Header from '@/components/header';
import { Footer } from '@/components/common/footer';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">Feedback Assistant</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Share your experience and help us improve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

