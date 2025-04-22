import NavToolbar from "./NavToolbar";
import AuthFormDialogViewWidget from "~/auth/views/auth-form-dialog";
import type { StrapiUser } from "@/types";

type DefaultLayoutProps = {
  children: React.ReactNode;
  history: {
    query: string;
    id: string;
    documentId: string;
  }[];
  user: StrapiUser | null;
};

function DefaultLayout({ children, history, user }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <NavToolbar
          history={history}
          user={user}
        />
      </header>

      <main className="pb-20">
        {children}
      </main>

      {/* Auth Modal for login/register/password reset */}
      <AuthFormDialogViewWidget />
    </div>
  );
}

export default DefaultLayout;
