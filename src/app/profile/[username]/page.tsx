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
import { MatchedIssuesSection } from "@/components/recommendations";
import { getProfileAndRecommendations } from "@/lib/recommendations";
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
    title: `@${decoded} — Profile Analysis & Matched Issues | OSS Match`,
    description: `Technology footprint, public repository analysis, and matched open-source issues for GitHub user @${decoded}.`,
  };
}

/**
 * Profile Analysis & Recommendations Page — /profile/[username]
 *
 * Server Component executing profile analysis, issue discovery, and matching.
 * Renders verified GitHub user profile, matched open-source issues,
 * language footprint, detected technologies, and analyzed repositories.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const state = await getProfileAndRecommendations(decodedUsername);

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
        {state.status === "error" ? (
          <ProfileErrorState
            error={state.error}
            username={decodedUsername}
          />
        ) : (
          <>
            <ProfileHeader
              user={state.profile.user}
              metadata={state.profile.metadata}
            />

            <AnalysisSummary
              metadata={state.profile.metadata}
              totalLanguagesCount={
                state.profile.languageFootprint.uniqueLanguagesCount
              }
            />

            {state.profile.repositories.length === 0 ? (
              <EmptyProfileCard username={state.profile.user.login} />
            ) : (
              <>
                <MatchedIssuesSection
                  recommendations={state.recommendations}
                  discovery={state.discovery}
                />

                <LanguageFootprintCard
                  footprint={state.profile.languageFootprint}
                />

                <TechnologyFootprintCard
                  technologies={state.profile.technologies}
                />

                <RepositoryList
                  repositories={state.profile.repositories}
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
