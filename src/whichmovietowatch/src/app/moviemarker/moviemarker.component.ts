import { Component, OnInit, HostListener, ChangeDetectorRef, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { GapiService } from '../gapi.service';
import { Movie } from './movie';

let t: any;

enum WatchAttributes { seen = 'seen', unseen = 'unseen', watch = 'watch', skip = 'skip', rewatch = 'rewatch', forget = 'forget' };
enum ActiveMarking { all = 'all', seen = 'seen', unseen = 'unseen' };

@Component({
  selector: 'app-moviemarker',
  templateUrl: './moviemarker.component.html',
  styleUrls: ['./moviemarker.component.styl']
})
export class MoviemarkerComponent implements OnInit {

  public movieName: string;
  public movies: Movie[];
  public currentMovie: Movie;
  public currentMovieSearchLink: SafeResourceUrl;
  public watchDb: { [imdb_id: string]: { movie: Movie, attributes: WatchAttributes[] } } = {};
  public entries: { movie: Movie, attributes: WatchAttributes[] }[];

  public initialized = false;
  public cfgFileId;
  public dbFileId;

  public userProfile: any;

  public activeMarking: ActiveMarking;

  public activeMarkingChanged(event) {
    this.activeMarking = event.value;
    this.setActionNames();
    this.refreshCurrentMovie();
    this.refreshEntries();
  }

  public positiveActionName: WatchAttributes;
  public negativeActionName: WatchAttributes;

  ngOnInit() {
  }

  public setActionNames() {
    if (this.activeMarking == ActiveMarking.all) {
      this.positiveActionName = WatchAttributes.seen;
      this.negativeActionName = WatchAttributes.unseen;
    }
    else if (this.activeMarking == ActiveMarking.seen) {
      this.positiveActionName = WatchAttributes.rewatch;
      this.negativeActionName = WatchAttributes.forget;
    }
    else if (this.activeMarking == ActiveMarking.unseen) {
      this.positiveActionName = WatchAttributes.watch;
      this.negativeActionName = WatchAttributes.skip;
    }
  }

  constructor(private sanitizer: DomSanitizer, private http: HttpClient, public gapiService: GapiService, private ref: ChangeDetectorRef) {
    this.entries = [];
    this.activeMarking = ActiveMarking.all;
    this.setActionNames();
    t = this;

    this.http.get('assets/movies.csv', { responseType: 'text' })
      .subscribe(
        data => {
          var asJson = this.csvJSON(data);
          this.movies = asJson;
          this.refreshCurrentMovie();
        },
        error => {
          console.log(error);
        }
      );

    this.gapiService.isSignedInSubject.subscribe(isHe => {
      if (this.initialized == false && isHe) {
        this.initialized = true;

        var currentUser = gapiService.authInstance.currentUser.get();
        var profile = currentUser.getBasicProfile();
        t.userProfile = profile;
        ref.detectChanges();

        this.tryUseExistingDb().then(success => console.log(success), fail => this.resetCfgAndDb());
      }
    });
  }

  public tryUseExistingDb(): Promise<any> {
    return new Promise((success, reject) => {

      this.gapiService.getFileNamed("wmtw.cfg", true).then(cfgFile => {
        if (cfgFile) {
          console.log('found cfg');
          this.gapiService.downloadFile(cfgFile.id).then(file => {
            file.json().then(content => {
              let gdriveDbFileId = content;
              this.gapiService.downloadFile(gdriveDbFileId).then(dbFile => {
                if (dbFile.ok) {
                  console.log('found db file');
                  dbFile.json().then(dbFileContent => {

                    Object.keys(dbFileContent).forEach(element => {
                      this.watchDb[element] = dbFileContent[element];
                    });

                    this.cfgFileId = cfgFile.id;
                    this.dbFileId = gdriveDbFileId
                    this.refreshCurrentMovie();
                    this.refreshEntries();

                    success(dbFileContent);
                  })
                }
                else {
                  console.log("db file missing");
                  console.log(dbFile);
                  reject('no db file');
                }
              })
            })
          });
        }
        else {
          reject('no cfg file');
        }
      });
    })
  }

  public resetCfgAndDb() {
    console.log('didnt find cfg');

    this.gapiService.getFiles(true).then(appDataFiles => {
      appDataFiles.forEach(file => {
        this.gapiService.deleteFile(file.id);
      });

      this.gapiService.fillNewFile({}, 'wmtwDb').then(onFullfilled => {
        if (onFullfilled) {
          //console.log(onFullfilled);
          onFullfilled.json().then(content => {
            //console.log(content);
            let gdriveFileId = content.id;
            this.gapiService.fillNewFile(gdriveFileId, "wmtw.cfg", true).then(res => console.log(res));
          })
        }
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    // console.log(event.keyCode);
    if (event.keyCode == 37) {
      this.watched(false);
    }
    if (event.keyCode == 39) {
      this.watched(true);
    }
  }

  public saveHistory() {
    console.log(this.watchDb);
    if (this.initialized != true) {
      this.gapiService.signIn().then(() => this.gapiService.fillNewFile(this.watchDb, 'wmtwDb', false, this.dbFileId));
    }
    else {
      this.gapiService.fillNewFile(this.watchDb, 'wmtwDb', false, this.dbFileId);
    }
  }

  public watched(has: boolean) {
    if (this.activeMarking == ActiveMarking.all) {
      this.watchDb[this.currentMovie.imdb_id] = { movie: this.currentMovie, attributes: [] };
    }

    this.watchDb[this.currentMovie.imdb_id].attributes.push(has ? this.positiveActionName : this.negativeActionName);
    console.log(this.watchDb)

    this.refreshEntries();
    this.refreshCurrentMovie();
  }

  public refreshEntries() {
    console.log('refresh entries');

    this.entries.length = 0;
    var obEntries: { movie: Movie, attributes: WatchAttributes[] }[] = Object.values(this.watchDb);
    if (this.activeMarking == ActiveMarking.all) this.entries.push(...obEntries);
    if (this.activeMarking == ActiveMarking.seen) this.entries.push(...obEntries.filter(e => e.attributes.includes(WatchAttributes.seen)));
    if (this.activeMarking == ActiveMarking.unseen) this.entries.push(...obEntries.filter(e => e.attributes.includes(WatchAttributes.unseen)));

    console.log(this.entries);
    this.ref.detectChanges();
  }

  public refreshCurrentMovie() {
    this.currentMovie = null;

    if (this.activeMarking == ActiveMarking.all) {
      for (let iter = 0; iter < this.movies.length; iter++) {

        if (!(this.movies[iter].imdb_id in this.watchDb)) {
          this.currentMovie = this.movies[iter];
          break;
        }
      }
    }
    else if (this.activeMarking == ActiveMarking.seen) {

      for (let iter = 0; iter < this.movies.length; iter++) {
        let movie = this.watchDb[this.movies[iter].imdb_id];

        if (movie
            && movie.attributes.includes(WatchAttributes.seen)
            && !movie.attributes.includes(this.positiveActionName)
            && !movie.attributes.includes(this.negativeActionName)) {
          this.currentMovie = this.movies[iter];
          break;
        }
      }
    }
    else {

      for (let iter = 0; iter < this.movies.length; iter++) {
        let movie = this.watchDb[this.movies[iter].imdb_id];

        if (movie
            && movie.attributes && movie.attributes.includes(WatchAttributes.unseen)
            && !movie.attributes.includes(this.positiveActionName)
            && !movie.attributes.includes(this.negativeActionName)) {
          this.currentMovie = this.movies[iter];
          break;
        }
      }
    }

    this.currentMovieSearchLink = this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://www.bing.com/images/search?q=" + this.currentMovie.title + " movie");
  }

  public removeWatched(movie: { movie: Movie }) {
    console.log(movie);
    delete this.watchDb[movie.movie.imdb_id];
    this.refreshEntries();
    console.log(this.watchDb);
  }

  public keys(o) {return Object.keys(o)}

  public csvJSON(csv) {

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
