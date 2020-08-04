import { Component, OnInit, HostListener, ChangeDetectorRef, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { GapiService } from '../gapi.service';

let t: any;

@Component({
  selector: 'app-moviemarker',
  templateUrl: './moviemarker.component.html',
  styleUrls: ['./moviemarker.component.styl']
})
export class MoviemarkerComponent implements OnInit {

  public movieName;
  public movies;
  public currentMovie;
  public currentMovieSearchLink;
  public watchDb = {};
  public currentMovieIter = 0;
  public entries: any[];

  public initialized = false;
  public cfgFileId;
  public dbFileId;

  public userProfile: any;

  public activeMarking: any;

  public activeMarkingChanged(event) {
    this.activeMarking = event.value;
    this.refreshCurrentMovie();
    this.refreshEntries();
  }

  ngOnInit() {
  }

  constructor(private sanitizer: DomSanitizer, private http: HttpClient, public gapiService: GapiService, private ref: ChangeDetectorRef) {
    this.entries = [];
    this.activeMarking = 'all';
    t = this;

    this.http.get('assets/movies.csv', { responseType: 'text' })
      .subscribe(
        data => {
          var asJson = this.csvJSON(data);
          this.movies = asJson;
          this.currentMovie = this.movies[this.currentMovieIter];
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
    this.watchDb[this.currentMovie.imdb_id] = { movie: this.currentMovie, watched: has };
    this.refreshEntries();
    this.refreshCurrentMovie();
  }

  public refreshEntries() {
    console.log('refresh entries');

    this.entries.length = 0;
    if (this.activeMarking == 'all') this.entries.push(...Object.entries(this.watchDb));
    if (this.activeMarking == 'watched') this.entries.push(...Object.entries(this.watchDb).filter(e => e[1].watched == true));
    if (this.activeMarking == 'notwatched') this.entries.push(...Object.entries(this.watchDb).filter(e => e[1].watched == false));

    this.ref.detectChanges();
    console.log(this.entries);
  }

  public refreshCurrentMovie() {

    while (this.movies[this.currentMovieIter].imdb_id in this.watchDb) {
      this.currentMovieIter++;
    }
    this.currentMovie = this.movies[this.currentMovieIter];

    this.currentMovieSearchLink = this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://www.bing.com/images/search?q=" + this.currentMovie.title + " movie");
  }

  public removeWatched(movie) {
    console.log(movie);
    delete this.watchDb[movie[0]];
    this.refreshEntries();
    console.log(this.watchDb);
  }

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
