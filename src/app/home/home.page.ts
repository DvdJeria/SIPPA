import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { SqliteService } from '../services/sqlite';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButtons,
    IonMenuButton
  ]
})
export class HomePage implements OnInit {

  public folder!: string;
  private sqliteService = inject(SqliteService);

  //constructor() { }
  async ngOnInit() {
    this.folder = 'Home';

    try {
      await this.sqliteService.initializeDatabase();
      console.log('SQLite inicializado y listo para usar.');

    } catch (e) {
      console.error('La aplicación no pudo iniciar la DB local:', e);
      // ...
    }
  }

}
