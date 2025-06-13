import Header from '@/components/header';
import { Footer } from '@/components/common/footer';
import { LoginForm } from '@/components/admin/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 md:py-12 bg-secondary/30">
        <div className="container mx-auto max-w-md px-4">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">Admin Login</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Access the Maveric dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
