import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { GapiService } from '../gapi.service';

@Component({
  selector: 'app-moviemarker',
  templateUrl: './moviemarker.component.html',
  styleUrls: ['./moviemarker.component.styl']
})
export class MoviemarkerComponent implements OnInit {

  public movieName;
  public movies;
  public currentMovie;
  public watchDb = {};
  public currentMovieIter = 0;
  public obj = Object;


  constructor(private sanitizer: DomSanitizer, private http: HttpClient, public gapiService: GapiService) {

    this.http.get('assets/movies.csv', { responseType: 'text' })
      .subscribe(
        data => {
          var asJson = this.csvJSON(data);
          this.movies = asJson;
          this.currentMovie = this.movies[this.currentMovieIter];
          // console.log(this.currentMovie);
        },
        error => {
          console.log(error);
        }
    );

    this.gapiService.isSignedInSubject.subscribe(isHe => {
      console.log(isHe);
      gapiService.getFiles().then(files => console.log(files));
    });
  }

  getMovieName() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://www.bing.com/images/search?q=" + this.currentMovie.title + " ");
  }

  ngOnInit(): void {
  }

  saveHistory() {
    console.log(this.watchDb);
    this.gapiService.createFile(this.watchDb);
  }

  watched(has: boolean) {
    console.log(has);
    this.watchDb[this.currentMovie.imdb_id] = [this.currentMovie, has];

    while (this.movies[this.currentMovieIter].imdb_id in this.watchDb) {
      // console.log(this.currentMovieIter);
      // console.log(this.watchDb);
      this.currentMovieIter++;
    }
    this.currentMovie = this.movies[this.currentMovieIter];
    // console.log(this.currentMovie);
    // console.log(this.currentMovieIter);
    // console.log(this.obj.entries(this.watchDb));
  }

  csvJSON(csv) {

    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(";");

    for (var i = 1; i < lines.length; i++) {

      var obj = {};
      var currentline = lines[i].split(";");

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);

    }

    return result;
  }
}
