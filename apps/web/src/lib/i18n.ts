/**
 * Translation dictionary.
 *
 * A plain object rather than an i18n library: the site has two languages and a
 * few hundred strings, so a runtime, plural-aware framework would cost more
 * bundle than it saves. `en` is the source of truth - TranslationKey is derived
 * from it, so a key added there and forgotten in `es` is a type error rather
 * than a silent fallback at runtime.
 *
 * Interpolation is `{name}` placeholders, substituted by `translate`.
 */

export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "es", label: "ES", name: "Español" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";

const en = {
  /* Navigation and chrome */
  "nav.primary": "Primary",
  "nav.home": "Home",
  "nav.fixtures": "Fixtures",
  "nav.standings": "Standings",
  "nav.players": "Players",
  "nav.nations": "Nations",
  "nav.news": "News",
  "nav.donate": "Donate",
  "nav.support": "Support Esquinazo",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.language": "Language",
  "nav.skip": "Skip to content",

  /* Home */
  "home.title": "Football, measured",
  "home.eyebrow": "Football's major leagues · live",
  "home.tagline":
    "Scores, tables, squads. No ads, no logins, no nonsense — just what happened and who's next.",
  "home.ctaMatches": "Today's matches",
  "home.ctaTables": "Tables",
  "home.scroll": "Scroll",
  "home.inPlay": "In play",
  "home.nextUp": "Next up",
  "home.liveNow": "Live right now",
  "home.todaysFixtures": "Today's fixtures",
  "home.allFixtures": "All fixtures →",
  "home.noneToday":
    "No matches scheduled today. The season never really stops — check the fixture list.",
  "home.statMatches": "Matches tracked",
  "home.statLeagues": "Leagues",
  "home.statPlayers": "Players indexed",
  "home.statRefresh": "Refresh interval",
  "home.statRefreshUnit": " min",
  "home.headlines": "Headlines",
  "home.aroundLeagues": "Around the leagues",
  "home.allNews": "All news →",

  /* Fixtures */
  "fixtures.eyebrow": "Matches",
  "fixtures.title": "Fixtures",
  "fixtures.lede":
    "One week at a time - scheduled and completed matches in the selected competition.",
  "fixtures.thisWeek": "This week",
  "fixtures.lastWeek": "Last week",
  "fixtures.nextWeek": "Next week",
  "fixtures.prevWeekLabel": "Previous week",
  "fixtures.nextWeekLabel": "Next week",
  "fixtures.updating": "Updating…",
  "fixtures.liveOne": "{count} live match",
  "fixtures.liveMany": "{count} live matches",
  "fixtures.emptyTitle": "No matches this week",
  "fixtures.emptyDetail":
    "Nothing scheduled for {league} during {range}. Try the next or previous week - mid-season breaks and international windows leave gaps like this.",

  /* Standings */
  "standings.eyebrow": "Table",
  "standings.title": "Standings",
  "standings.lede":
    "Position, record and recent form. Green marks the continental places, red the drop.",
  "standings.emptyTitle": "No table yet",
  "standings.emptyDetail":
    "Standings appear once the competition has played its opening round. Cup formats may not produce one at all.",
  "standings.club": "Club",
  "standings.played": "Pl",
  "standings.won": "W",
  "standings.drawn": "D",
  "standings.lost": "L",
  "standings.goalDiff": "GD",
  "standings.points": "Pts",
  "standings.form": "Form",
  "standings.zoneChampions": "Champions League",
  "standings.zoneEuropa": "Europa / play-off",
  "standings.zoneRelegation": "Relegation",
  "standings.recentForm": "Recent form: {results}",

  /* Players */
  "players.eyebrow": "Squads",
  "players.title": "Players",
  "players.lede": "Choose a league and a club, then filter by name, position or shirt number.",
  "players.club": "{league} club",
  "players.search": "Search squad",
  "players.searchPlaceholder": "Name, position or number",
  "players.registered": "{count} registered",
  "players.noMatchTitle": "No one matches that",
  "players.noMatchDetail":
    "Nothing in this squad matches “{search}”. Try a surname, or a position like \"Midfielder\".",
  "players.unavailableTitle": "Squad unavailable",
  "players.unavailableDetail": "The feed has no squad list for this club yet.",
  "players.clearSearch": "Clear search",

  /* Positions - the four the provider actually reports */
  "position.Goalkeeper": "Goalkeeper",
  "position.Defender": "Defender",
  "position.Midfielder": "Midfielder",
  "position.Attacker": "Attacker",
  "position.groupGoalkeeper": "Goalkeepers",
  "position.groupDefender": "Defenders",
  "position.groupMidfielder": "Midfielders",
  "position.groupAttacker": "Attackers",
  "position.legendTitle": "Position guide",
  "position.legendShow": "Show",
  "position.legendHide": "Hide",
  "position.legendNote":
    "The data provider reports these four categories only, so squads are grouped by them rather than by finer roles like centre back or winger.",
  "position.descGoalkeeper": "Keeps goal. Wears a different shirt and is the only player who may handle the ball in play.",
  "position.descDefender": "Plays at the back — centre backs and full backs alike.",
  "position.descMidfielder": "Links defence and attack, from holding roles to attacking ones.",
  "position.descAttacker": "Plays furthest forward — strikers, centre forwards and wingers.",

  /* News */
  "news.eyebrow": "Reading",
  "news.title": "News",
  "news.lede": "Transfer business, injury news and match reports from across the continent.",
  "news.notWiredTitle": "Not wired up yet",
  "news.notWiredDetail":
    "The news feed has not shipped. Everything else on the site runs on live data — fixtures and tables update every minute.",
  "news.emptyTitle": "Nothing published",
  "news.emptyDetail":
    "No stories have come through the feed today. Try the fixtures page for what is actually happening.",

  /* Match detail */
  "match.title": "Match",
  "match.backToFixtures": "← Fixtures",
  "match.notFoundTitle": "Match not found",
  "match.notFoundDetail":
    "This fixture is not in the current feed window. Completed matches drop out of the list once the round moves on.",
  "match.backButton": "Back to fixtures",
  "match.facts": "Match facts",
  "match.competition": "Competition",
  "match.round": "Round",
  "match.venue": "Venue",
  "match.kickoff": "Kick-off",
  "match.status": "Status",
  "match.halfTime": "Half-time",
  "match.fullTime": "Full-time",
  "match.live": "Live",
  "match.timeline": "Timeline",
  "match.timelineEmpty":
    "No events yet. Goals, cards and substitutions appear here as the match runs.",
  "match.lineups": "Lineups",
  "match.startingXI": "Starting XI",
  "match.substitutes": "Substitutes",
  "match.coach": "Coach",
  "match.formation": "Formation",
  "match.lineupsEmpty": "Lineups are published about an hour before kick-off.",
  "match.stats": "Match stats",
  "match.statsEmpty": "Statistics appear once the match is under way.",

  /* Event labels */
  "event.Goal": "Goal",
  "event.ownGoal": "Own goal",
  "event.penalty": "Penalty",
  "event.missedPenalty": "Missed penalty",
  "event.yellowCard": "Yellow card",
  "event.redCard": "Red card",
  "event.substitution": "Substitution",
  "event.var": "VAR",
  "event.assist": "Assist: {name}",
  "event.subIn": "On",
  "event.subOut": "Off",

  /* Statistic labels */
  "stat.possession": "Possession",
  "stat.shots": "Shots",
  "stat.onTarget": "On target",
  "stat.corners": "Corners",
  "stat.fouls": "Fouls",
  "stat.offsides": "Offsides",
  "stat.saves": "Saves",
  "stat.yellowCards": "Yellow cards",
  "stat.redCards": "Red cards",
  "stat.passAccuracy": "Pass accuracy",

  /* Nations */
  "nations.eyebrow": "World Cup 2026",
  "nations.title": "Nations",
  "nations.lede":
    "The 48 national teams at the 2026 World Cup, with their groups and squads.",
  "nations.group": "Group",
  "nations.ungrouped": "Group to be drawn",
  "nations.selectNation": "Nation",
  "nations.squad": "Squad",
  "nations.squadEmptyTitle": "Squad not published",
  "nations.squadEmptyDetail":
    "This national team has no squad list in the feed yet. Squads firm up close to the tournament.",
  "nations.clubNote":
    "Club affiliation is not published for national-team squads, so only shirt number, age and position are shown.",
  "nations.emptyTitle": "Nations unavailable",
  "nations.emptyDetail": "The tournament's team list has not come through the feed yet.",

  /* Not found */
  "notFound.title": "Page not found",
  "notFound.badge": "Error 404",
  "notFound.headline": "Off the pitch",
  "notFound.detail": "That page does not exist. The scores, however, do.",

  /* Shared states */
  "state.retry": "Try again",
  "state.errorBadge": "Error",
  "state.notFoundTitle": "Nothing here",
  "state.notFoundDetail": "That record does not exist, or the feed no longer carries it.",
  "state.rateLimitTitle": "Too many requests",
  "state.rateLimitDetail": "The upstream provider is throttling us. It clears within a minute.",
  "state.upstreamTitle": "The data feed is down",
  "state.upstreamDetail":
    "Our provider is not responding. Cached results are shown where we have them.",
  "state.genericTitle": "Could not load",
  "state.genericDetail": "Something went wrong on the way to the server.",

  /* Footer */
  "footer.blurb":
    "Live scores, tables and squads across football's major leagues. No accounts, no tracking, no interstitials.",
  "footer.matches": "Matches",
  "footer.people": "People",
  "footer.keepRunning": "Keep it running",
  "footer.keepRunningBlurb": "Esquinazo is free and ad-free. Hosting is not.",
  "footer.buyCoffee": "Buy a coffee",
  "footer.poweredBy": "Powered by",
  "footer.dataFrom": "Match data from",
} as const;

export type TranslationKey = keyof typeof en;

/**
 * Typed as Record<TranslationKey, string> so a missing or misspelled Spanish
 * key fails the build instead of silently rendering English.
 */
const es: Record<TranslationKey, string> = {
  "nav.primary": "Principal",
  "nav.home": "Inicio",
  "nav.fixtures": "Partidos",
  "nav.standings": "Clasificación",
  "nav.players": "Jugadores",
  "nav.nations": "Selecciones",
  "nav.news": "Noticias",
  "nav.donate": "Donar",
  "nav.support": "Apoya a Esquinazo",
  "nav.openMenu": "Abrir menú",
  "nav.closeMenu": "Cerrar menú",
  "nav.language": "Idioma",
  "nav.skip": "Saltar al contenido",

  "home.title": "Fútbol, medido",
  "home.eyebrow": "Las grandes ligas del fútbol · en vivo",
  "home.tagline":
    "Resultados, tablas, plantillas. Sin anuncios, sin cuentas, sin rodeos — solo lo que pasó y lo que viene.",
  "home.ctaMatches": "Partidos de hoy",
  "home.ctaTables": "Tablas",
  "home.scroll": "Desplaza",
  "home.inPlay": "En juego",
  "home.nextUp": "Próximos",
  "home.liveNow": "En vivo ahora",
  "home.todaysFixtures": "Partidos de hoy",
  "home.allFixtures": "Todos los partidos →",
  "home.noneToday":
    "No hay partidos programados hoy. La temporada nunca se detiene del todo — consulta el calendario.",
  "home.statMatches": "Partidos seguidos",
  "home.statLeagues": "Ligas",
  "home.statPlayers": "Jugadores indexados",
  "home.statRefresh": "Actualización",
  "home.statRefreshUnit": " min",
  "home.headlines": "Titulares",
  "home.aroundLeagues": "Por las ligas",
  "home.allNews": "Todas las noticias →",

  "fixtures.eyebrow": "Partidos",
  "fixtures.title": "Partidos",
  "fixtures.lede":
    "Una semana a la vez: partidos programados y disputados de la competición seleccionada.",
  "fixtures.thisWeek": "Esta semana",
  "fixtures.lastWeek": "Semana pasada",
  "fixtures.nextWeek": "Próxima semana",
  "fixtures.prevWeekLabel": "Semana anterior",
  "fixtures.nextWeekLabel": "Semana siguiente",
  "fixtures.updating": "Actualizando…",
  "fixtures.liveOne": "{count} partido en vivo",
  "fixtures.liveMany": "{count} partidos en vivo",
  "fixtures.emptyTitle": "Sin partidos esta semana",
  "fixtures.emptyDetail":
    "No hay nada programado para {league} durante {range}. Prueba la semana siguiente o anterior: los parones y las fechas FIFA dejan huecos así.",

  "standings.eyebrow": "Tabla",
  "standings.title": "Clasificación",
  "standings.lede":
    "Posición, registro y forma reciente. El verde marca los puestos continentales; el rojo, el descenso.",
  "standings.emptyTitle": "Todavía sin tabla",
  "standings.emptyDetail":
    "La clasificación aparece cuando la competición ha jugado su primera jornada. Los formatos de copa pueden no generarla.",
  "standings.club": "Club",
  "standings.played": "PJ",
  "standings.won": "G",
  "standings.drawn": "E",
  "standings.lost": "P",
  "standings.goalDiff": "DG",
  "standings.points": "Pts",
  "standings.form": "Forma",
  "standings.zoneChampions": "Liga de Campeones",
  "standings.zoneEuropa": "Europa / repesca",
  "standings.zoneRelegation": "Descenso",
  "standings.recentForm": "Forma reciente: {results}",

  "players.eyebrow": "Plantillas",
  "players.title": "Jugadores",
  "players.lede":
    "Elige una liga y un club, luego filtra por nombre, posición o dorsal.",
  "players.club": "Club de {league}",
  "players.search": "Buscar en la plantilla",
  "players.searchPlaceholder": "Nombre, posición o dorsal",
  "players.registered": "{count} inscritos",
  "players.noMatchTitle": "Nadie coincide",
  "players.noMatchDetail":
    "Nada en esta plantilla coincide con “{search}”. Prueba con un apellido o una posición como \"Centrocampista\".",
  "players.unavailableTitle": "Plantilla no disponible",
  "players.unavailableDetail": "Todavía no hay plantilla para este club.",
  "players.clearSearch": "Limpiar búsqueda",

  "position.Goalkeeper": "Portero",
  "position.Defender": "Defensa",
  "position.Midfielder": "Centrocampista",
  "position.Attacker": "Delantero",
  "position.groupGoalkeeper": "Porteros",
  "position.groupDefender": "Defensas",
  "position.groupMidfielder": "Centrocampistas",
  "position.groupAttacker": "Delanteros",
  "position.legendTitle": "Guía de posiciones",
  "position.legendShow": "Mostrar",
  "position.legendHide": "Ocultar",
  "position.legendNote":
    "El proveedor de datos informa solo estas cuatro categorías, así que las plantillas se agrupan por ellas y no por funciones más específicas como central o extremo.",
  "position.descGoalkeeper":
    "Defiende la portería. Viste distinto y es el único que puede tocar el balón con las manos en juego.",
  "position.descDefender": "Juega atrás: centrales y laterales por igual.",
  "position.descMidfielder":
    "Une defensa y ataque, desde funciones de contención hasta de creación.",
  "position.descAttacker": "Juega más adelantado: delanteros, arietes y extremos.",

  "news.eyebrow": "Lectura",
  "news.title": "Noticias",
  "news.lede": "Fichajes, lesiones y crónicas de partidos de todo el continente.",
  "news.notWiredTitle": "Todavía no conectado",
  "news.notWiredDetail":
    "El servicio de noticias aún no está publicado. Todo lo demás funciona con datos en vivo: partidos y tablas se actualizan cada minuto.",
  "news.emptyTitle": "Nada publicado",
  "news.emptyDetail":
    "Hoy no han llegado noticias. Prueba la página de partidos para ver lo que está pasando.",

  "match.title": "Partido",
  "match.backToFixtures": "← Partidos",
  "match.notFoundTitle": "Partido no encontrado",
  "match.notFoundDetail":
    "Este partido no está en la ventana actual de datos. Los partidos disputados salen de la lista cuando avanza la jornada.",
  "match.backButton": "Volver a partidos",
  "match.facts": "Datos del partido",
  "match.competition": "Competición",
  "match.round": "Jornada",
  "match.venue": "Estadio",
  "match.kickoff": "Inicio",
  "match.status": "Estado",
  "match.halfTime": "Descanso",
  "match.fullTime": "Final",
  "match.live": "En vivo",
  "match.timeline": "Cronología",
  "match.timelineEmpty":
    "Todavía sin incidencias. Goles, tarjetas y cambios aparecerán aquí durante el partido.",
  "match.lineups": "Alineaciones",
  "match.startingXI": "Titulares",
  "match.substitutes": "Suplentes",
  "match.coach": "Entrenador",
  "match.formation": "Formación",
  "match.lineupsEmpty": "Las alineaciones se publican una hora antes del inicio.",
  "match.stats": "Estadísticas",
  "match.statsEmpty": "Las estadísticas aparecen cuando el partido está en marcha.",

  "event.Goal": "Gol",
  "event.ownGoal": "Gol en propia",
  "event.penalty": "Penalti",
  "event.missedPenalty": "Penalti fallado",
  "event.yellowCard": "Tarjeta amarilla",
  "event.redCard": "Tarjeta roja",
  "event.substitution": "Sustitución",
  "event.var": "VAR",
  "event.assist": "Asistencia: {name}",
  "event.subIn": "Entra",
  "event.subOut": "Sale",

  "stat.possession": "Posesión",
  "stat.shots": "Disparos",
  "stat.onTarget": "A puerta",
  "stat.corners": "Córneres",
  "stat.fouls": "Faltas",
  "stat.offsides": "Fueras de juego",
  "stat.saves": "Paradas",
  "stat.yellowCards": "Tarjetas amarillas",
  "stat.redCards": "Tarjetas rojas",
  "stat.passAccuracy": "Precisión de pase",

  "nations.eyebrow": "Mundial 2026",
  "nations.title": "Selecciones",
  "nations.lede":
    "Las 48 selecciones del Mundial 2026, con sus grupos y plantillas.",
  "nations.group": "Grupo",
  "nations.ungrouped": "Grupo por sortear",
  "nations.selectNation": "Selección",
  "nations.squad": "Plantilla",
  "nations.squadEmptyTitle": "Plantilla no publicada",
  "nations.squadEmptyDetail":
    "Esta selección todavía no tiene lista de convocados. Las plantillas se concretan cerca del torneo.",
  "nations.clubNote":
    "El club no se publica para las plantillas de selecciones, así que solo se muestran dorsal, edad y posición.",
  "nations.emptyTitle": "Selecciones no disponibles",
  "nations.emptyDetail": "La lista de equipos del torneo aún no ha llegado.",

  "notFound.title": "Página no encontrada",
  "notFound.badge": "Error 404",
  "notFound.headline": "Fuera del campo",
  "notFound.detail": "Esa página no existe. Los resultados sí.",

  "state.retry": "Reintentar",
  "state.errorBadge": "Error",
  "state.notFoundTitle": "Aquí no hay nada",
  "state.notFoundDetail": "Ese registro no existe, o el proveedor ya no lo incluye.",
  "state.rateLimitTitle": "Demasiadas peticiones",
  "state.rateLimitDetail": "El proveedor nos está limitando. Se resuelve en un minuto.",
  "state.upstreamTitle": "El proveedor de datos no responde",
  "state.upstreamDetail":
    "Nuestro proveedor no responde. Se muestran resultados en caché cuando los hay.",
  "state.genericTitle": "No se pudo cargar",
  "state.genericDetail": "Algo salió mal camino del servidor.",

  "footer.blurb":
    "Resultados en vivo, tablas y plantillas de las grandes ligas del fútbol. Sin cuentas, sin rastreo, sin interrupciones.",
  "footer.matches": "Partidos",
  "footer.people": "Gente",
  "footer.keepRunning": "Mantenlo en marcha",
  "footer.keepRunningBlurb": "Esquinazo es gratis y sin anuncios. El alojamiento no lo es.",
  "footer.buyCoffee": "Invita a un café",
  "footer.poweredBy": "Con el apoyo de",
  "footer.dataFrom": "Datos de",
};

export const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, es };

export type TranslationVars = Record<string, string | number>;

/** Looks up a key and substitutes any `{name}` placeholders. */
export function translate(lang: Lang, key: TranslationKey, vars?: TranslationVars): string {
  const template = DICTIONARIES[lang][key] ?? DICTIONARIES[DEFAULT_LANG][key] ?? key;
  if (!vars) return template;

  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

/**
 * Maps the provider's English position names onto dictionary keys. Unknown
 * values pass through untranslated rather than being dropped.
 */
export const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"] as const;
export type PositionCategory = (typeof POSITION_ORDER)[number];

export function isKnownPosition(value: string | null | undefined): value is PositionCategory {
  return POSITION_ORDER.includes(value as PositionCategory);
}
