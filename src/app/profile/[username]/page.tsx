import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ProfileHeader,
  AnalysisSummary,
  LanguageFootprintCard,
  TechnologyFootprintCard,
  RepositoryList,
  EmptyProfileCard,
  ProfileErrorState,
} from "@/components/profile";
import { getProfileAnalysis } from "@/lib/profile";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  return {
    title: `@${decoded} — Profile Analysis | OSS Match`,
    description: `Technology footprint and public repository analysis for GitHub user @${decoded}.`,
  };
}

/**
 * Profile Analysis Page — /profile/[username]
 *
 * Server Component executing the profile analysis pipeline.
 * Fully renders verified GitHub user profile, language footprint,
 * detected technologies, and analyzed repositories.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const analysisState = await getProfileAnalysis(decodedUsername);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0E1012",
      }}
    >
      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "40px 16px 64px",
          width: "100%",
        }}
      >
        {analysisState.status === "error" ? (
          <ProfileErrorState
            error={analysisState.error}
            username={decodedUsername}
          />
        ) : (
          <>
            <ProfileHeader
              user={analysisState.data.user}
              metadata={analysisState.data.metadata}
            />

            <AnalysisSummary
              metadata={analysisState.data.metadata}
              totalLanguagesCount={
                analysisState.data.languageFootprint.uniqueLanguagesCount
              }
            />

            {analysisState.data.repositories.length === 0 ? (
              <EmptyProfileCard username={analysisState.data.user.login} />
            ) : (
              <>
                <LanguageFootprintCard
                  footprint={analysisState.data.languageFootprint}
                />

                <TechnologyFootprintCard
                  technologies={analysisState.data.technologies}
                />

                <RepositoryList
                  repositories={analysisState.data.repositories}
                />
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
