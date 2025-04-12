import { Component } from '@angular/core';
import { TodolistComponent } from './todolist/todolist.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodolistComponent],
  template: `<app-todolist></app-todolist>`
})
export class AppComponent {}
