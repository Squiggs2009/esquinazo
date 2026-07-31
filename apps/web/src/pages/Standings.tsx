import { useState } from "react";
import { Link } from "react-router-dom";
import { LeagueRail } from "@/components/LeagueRail";
import { TeamBadge } from "@/components/Badges";
import { SkeletonList, TableRowSkeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useStandings } from "@/lib/queries";
import { formGuide } from "@/lib/format";
import { LEAGUES, type StandingRow } from "@/lib/api";
import { useReveal } from "@/lib/motion";

export default function Standings() {
  useTitle("Standings");

  const [competition, setCompetition] = useState("PL");
  const { data, isPending, isError, error, refetch } = useStandings(competition);

  // The feed returns several tables (total / home / away); the overall one is
  // what a league table means.
  const table = data?.data.standings.find((s) => s.type === "TOTAL") ?? data?.data.standings[0];
  const rows = table?.table ?? [];
  const league = LEAGUES.find((l) => l.code === competition);

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
          ) : rows.length === 0 ? (
            <EmptyState
              headline="No table yet"
              detail="Standings appear once the competition has played its opening round. Cup formats may not produce one at all."
            />
          ) : (
            <Table key={competition} rows={rows} />
          )}
        </div>
      </div>
    </>
  );
}

function Table({ rows }: { rows: StandingRow[] }) {
  const scope = useReveal<HTMLDivElement>({ y: 14, stagger: 0.02, duration: 0.6 });

  return (
    <div ref={scope} className="overflow-x-auto">
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
                <span className={`absolute inset-y-0 left-0 w-0.5 ${zoneColor(row.position)}`} />
                <span className="tnum text-ink-muted">{row.position}</span>
              </td>

              <td className="py-3">
                <Link
                  to={`/players?team=${row.team.id}`}
                  className="flex items-center gap-3 transition-colors duration-300 hover:text-ember"
                >
                  <TeamBadge team={row.team} size="sm" />
                  <span className="truncate font-semibold">
                    {row.team.shortName ?? row.team.name}
                  </span>
                </Link>
              </td>

              <td className="tnum py-3 text-right text-ink-muted">{row.playedGames}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.won}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.draw}</td>
              <td className="tnum py-3 text-right text-ink-muted">{row.lost}</td>
              <td className="tnum py-3 text-right text-ink-muted">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
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
        <Legend className="bg-ember" label="Europa places" />
        <Legend className="bg-blood" label="Relegation" />
      </p>
    </div>
  );
}

/** Position colouring uses the common European shape: top 4, next 2, bottom 3. */
function zoneColor(position: number): string {
  if (position <= 4) return "bg-emerald-500";
  if (position <= 6) return "bg-ember";
  if (position >= 18) return "bg-blood";
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
