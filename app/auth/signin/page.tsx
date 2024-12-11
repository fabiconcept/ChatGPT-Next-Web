import SignInForm from "../components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to ChatGPT Next Web
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in or register with your email or phone number
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
