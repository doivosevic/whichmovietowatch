import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-moviemarker',
  templateUrl: './moviemarker.component.html',
  styleUrls: ['./moviemarker.component.styl']
})
export class MoviemarkerComponent implements OnInit {

  public movieName;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {
    this.movieName = this.sanitizer.bypassSecurityTrustResourceUrl("https://www.google.com/search?igu=1&ei=&q=Lion king");


    this.http.get('assets/movies.csv', { responseType: 'text' })
      .subscribe(
        data => {
          console.log(data);
          var asJson = this.csvJSON(data);
          console.log(asJson);
        },
        error => {
          console.log(error);
        }
      );
  }

  ngOnInit(): void {
  }

  //var csv is the CSV file with headers
  csvJSON(csv) {

    var lines = csv.split("\n");

    var result = [];

    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers = lines[0].split(";");

    for (var i = 1; i < lines.length; i++) {

      var obj = {};
      var currentline = lines[i].split(";");

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);

    }

    //return result; //JavaScript object
    return result; //JSON
  }
}
