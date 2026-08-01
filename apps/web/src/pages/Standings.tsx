import { useState } from "react";
import { Link } from "react-router-dom";
import { LeagueRail } from "@/components/LeagueRail";
import { TeamBadge } from "@/components/Badges";
import { SkeletonList, TableRowSkeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useStandings } from "@/lib/queries";
import { formGuide } from "@/lib/format";
import { DEFAULT_LEAGUE_ID, LEAGUES, type StandingRow } from "@/lib/api";
import { useReveal } from "@/lib/motion";

export default function Standings() {
  useTitle("Standings");

  const [competition, setCompetition] = useState(DEFAULT_LEAGUE_ID);
  const { data, isPending, isError, error, refetch } = useStandings(competition);

  // A league returns a single group; a cup returns one per group.
  const groups = data?.data.standings ?? [];
  const hasRows = groups.some((group) => group.length > 0);
  const league = LEAGUES.find((l) => l.id === competition);

  return (
    <>
      <PageHeader
        eyebrow="Table"
        title="Standings"
        lede="Position, record and recent form. Green marks the continental places, red the drop."
      />

      <div className="u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <LeagueRail value={competition} onChange={setCompetition} />

        <div className="min-w-0">
          <h2 className="u-display mb-6 border-b border-ink-line pb-4 text-sm text-ink-bright">
            {league?.name ?? competition}
          </h2>

          {isPending ? (
            <SkeletonList count={12}>{() => <TableRowSkeleton />}</SkeletonList>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : !hasRows ? (
            <EmptyState
              headline="No table yet"
              detail="Standings appear once the competition has played its opening round. Cup formats may not produce one at all."
            />
          ) : (
            <div key={competition} className="flex flex-col gap-12">
              {groups.map((rows, index) => (
                <Table
                  key={rows[0]?.group ?? index}
                  rows={rows}
                  // Only worth labelling when there is more than one to tell apart.
                  {...(groups.length > 1 && rows[0]?.group
                    ? { caption: rows[0].group }
                    : {})}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Table({ rows, caption }: { rows: StandingRow[]; caption?: string }) {
  const scope = useReveal<HTMLDivElement>({ y: 14, stagger: 0.02, duration: 0.6 });

  return (
    <div ref={scope} className="overflow-x-auto">
      {caption && <h3 className="u-eyebrow mb-4 text-ember">{caption}</h3>}

      <table className="w-full min-w-[38rem] border-collapse text-sm">
        <thead>
          <tr className="u-eyebrow border-b border-ink-line text-left">
            <th scope="col" className="w-10 py-3 pl-2 font-normal">
              #
            </th>
            <th scope="col" className="py-3 font-normal">
              Club
            </th>
            <th scope="col" className="w-12 py-3 text-right font-normal">
              Pl
            </th>
            <th scope="col" className="w-10 py-3 text-right font-normal">
              W
            </th>
            <th scope="col" className="w-10 py-3 text-right font-normal">
              D
            </th>
            <th scope="col" className="w-10 py-3 text-right font-normal">
              L
            </th>
            <th scope="col" className="w-14 py-3 text-right font-normal">
              GD
            </th>
            <th scope="col" className="w-14 py-3 text-right font-normal">
              Pts
            </th>
            <th scope="col" className="hidden w-32 py-3 pl-6 font-normal sm:table-cell">
              Form
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.team.id}
              className="js-reveal group border-b border-ink-line transition-colors duration-300
                         hover:bg-ink-raised"
            >
              <td className="relative py-3 pl-2">
                <span className={`absolute inset-y-0 left-0 w-0.5 ${zoneColor(row.description)}`} />
                <span className="tnum text-ink-muted">{row.rank}</span>
              </td>

              <td className="py-3">
                <Link
                  to={`/players?team=${row.team.id}`}
                  className="flex items-center gap-3 transition-colors duration-300 hover:text-ember"
                >
                  <TeamBadge team={row.team} size="sm" />
                  <span className="truncate font-semibold">{row.team.name}</span>
                </Link>
              </td>

              <td className="tnum py-3 text-right text-ink-muted">{row.all.played}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.all.win}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.all.draw}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.all.lose}</td>
              <td className="tnum py-3 text-right text-ink-muted">
                {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
              </td>
              <td className="tnum u-display py-3 text-right text-ink-bright">{row.points}</td>

              <td className="hidden py-3 pl-6 sm:table-cell">
                <FormDots form={row.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-muted">
        <Legend className="bg-emerald-500" label="Champions League" />
        <Legend className="bg-ember" label="Europa / play-off" />
        <Legend className="bg-blood" label="Relegation" />
      </p>
    </div>
  );
}

/**
 * Zone colouring comes from the provider's own `description` rather than fixed
 * position numbers: across ten competitions the cut-offs differ (the
 * Championship promotes via play-off, Liga MX has a Liguilla, cups have none at
 * all), so hardcoding "top 4, bottom 3" would mislabel most of them.
 */
function zoneColor(description: string | null | undefined): string {
  if (!description) return "bg-transparent";
  const text = description.toLowerCase();

  if (text.includes("relegation")) return "bg-blood";
  if (text.includes("champions league")) return "bg-emerald-500";
  if (text.includes("europa") || text.includes("conference") || text.includes("play-off")) {
    return "bg-ember";
  }
  if (text.includes("promotion")) return "bg-emerald-500";
  return "bg-transparent";
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

const RESULT_STYLES = {
  W: "bg-emerald-500/85 text-ink",
  D: "bg-ink-muted/40 text-ink-bright",
  L: "bg-blood text-ink-bright",
} as const;

function FormDots({ form }: { form: string | null | undefined }) {
  const results = formGuide(form);

  if (results.length === 0) {
    return <span className="text-xs text-ink-muted">—</span>;
  }

  return (
    <span className="flex gap-1.5" aria-label={`Recent form: ${results.join(", ")}`}>
      {results.map((result, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`grid h-5 w-5 place-items-center rounded-full text-[0.625rem] font-bold
                      ${RESULT_STYLES[result]}`}
        >
          {result}
        </span>
      ))}
    </span>
  );
}
