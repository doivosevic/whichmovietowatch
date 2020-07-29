
export class Movie {
  budget: string;
  genres: string;
  id: string;
  imdbId: string;
  originalLanguage: string;
  originalTitle: string;
  overview: string;
  popularity: string;
  productionCompanies: string;
  releaseDate: string;
  revenue: string;
  runtime: string;
  spokenLanguages: string;
  tagline: string;
  title: string;
  voteAverage: string;
  voteCount: string;

  constructor(
    budget: string,
    genres: string,
    id: string,
    imdbId: string,
    originalLanguage: string,
    originalTitle: string,
    overview: string,
    popularity: string,
    productionCompanies: string,
    releaseDate: string,
    revenue: string,
    runtime: string,
    spokenLanguages: string,
    tagline: string,
    title: string,
    voteAverage: string,
    voteCount: string) {
    this.budget = budget;
    this.genres = genres;
    this.id = id;
    this.imdbId = imdbId;
    this.originalLanguage = originalLanguage;
    this.originalTitle = originalTitle;
    this.overview = overview;
    this.popularity = popularity;
    this.productionCompanies = productionCompanies;
    this.releaseDate = releaseDate;
    this.revenue = revenue;
    this.runtime = runtime;
    this.spokenLanguages = spokenLanguages;
    this.tagline = tagline;
    this.title = title;
    this.voteAverage = voteAverage;
    this.voteCount = voteCount;
  }
}
