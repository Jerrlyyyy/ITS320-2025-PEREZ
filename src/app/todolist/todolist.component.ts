import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TodoService } from '../todo-service.service';
import { CommonModule } from '@angular/common';

interface Todo {
  _id: string;
  task: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isEditing?: boolean;
  editTask?: string;
}

@Component({
  selector: 'app-todolist',
  templateUrl: './todolist.component.html',
  styleUrls: ['./todolist.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class TodolistComponent implements OnInit {
  todos: Todo[] = [];
  todoInput = new FormControl('');

  constructor(private todoService: TodoService) { }

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    this.todoService.getAllTodos().subscribe({
      next: (data) => {
        this.todos = data;
      },
      error: (error) => {
        console.error('Error fetching todos:', error);
      }
    });
  }

  addTodo(): void {
    const task = this.todoInput.value?.trim();
    if (!task) return;

    this.todoService.createTodo(task).subscribe({
      next: (newTodo) => {
        this.todos.push(newTodo);
        this.todoInput.setValue('');
      },
      error: (error) => {
        console.error('Error adding todo:', error);
      }
    });
  }

  // Update saveTodos method to clear data and save to database
  saveTodos(): void {
    // Check if there are any todos to save
    if (this.todos.length === 0) {
      console.log('No todos to save');
      return;
    }

    // For each todo in the list, ensure it's saved to the database
    // We'll use Promise.all to wait for all updates to complete
    const savePromises = this.todos.map(todo => {
      return new Promise<void>((resolve, reject) => {
        this.todoService.updateTodo(todo._id, todo).subscribe({
          next: () => resolve(),
          error: (err) => reject(err)
        });
      });
    });

    // Wait for all save operations to complete
    Promise.all(savePromises)
      .then(() => {
        console.log('All todos saved successfully!');
        // Clear todos from the screen
        this.todos = [];
        // You might want to show a success message to the user
        alert('All todos saved and cleared from view!');
      })
      .catch(error => {
        console.error('Error saving todos:', error);
        alert('There was an error saving your todos');
      });
  }

  toggleComplete(todo: Todo): void {
    const updatedTodo = { ...todo, completed: !todo.completed };
    this.todoService.updateTodo(todo._id, updatedTodo).subscribe({
      next: (updated) => {
        const index = this.todos.findIndex(t => t._id === updated._id);
        if (index !== -1) {
          this.todos[index] = updated;
        }
      },
      error: (error) => {
        console.error('Error updating todo:', error);
      }
    });
  }

  deleteTodo(id: string): void {
    this.todoService.deleteTodo(id).subscribe({
      next: () => {
        this.todos = this.todos.filter(todo => todo._id !== id);
      },
      error: (error) => {
        console.error('Error deleting todo:', error);
      }
    });
  }

  startEdit(todo: Todo): void {
    // Reset editing state for all todos
    this.todos.forEach(t => {
      t.isEditing = false;
    });
    
    // Set current todo to editing mode
    todo.isEditing = true;
    todo.editTask = todo.task;
  }

  updateTodo(todo: Todo): void {
    // Exit editing mode if task is empty
    if (!todo.editTask?.trim()) {
      todo.isEditing = false;
      return;
    }
    
    // Create updated todo object
    const updatedTodo = { 
      ...todo, 
      task: todo.editTask.trim(),
      isEditing: false 
    };
    
    // Call API to update
    this.todoService.updateTodo(todo._id, updatedTodo).subscribe({
      next: (updated) => {
        const index = this.todos.findIndex(t => t._id === updated._id);
        if (index !== -1) {
          // Keep local editing properties
          this.todos[index] = {
            ...updated,
            isEditing: false
          };
        }
      },
      error: (error) => {
        console.error('Error updating todo:', error);
        // Reset editing state on error
        todo.isEditing = false;
      }
    });
  }
}