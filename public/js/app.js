import axios from 'axios';
import Swal from 'sweetalert2';

// Fetch and render Cases
async function fetchCases() {
  try {
    const response = await axios.get('/api/cases');
    renderCases(response.data);
  } catch (error) {
    console.error('Error fetching cases:', error);
  }
}

function renderCases(cases) {
  const casesContainer = document.getElementById('cases-container');
  casesContainer.innerHTML = '';
  cases.forEach((caseItem) => {
    const caseElement = document.createElement('div');
    caseElement.innerHTML = `
      <h3>${caseItem.title}</h3>
      <p>${caseItem.description}</p>
      <button onclick="deleteCase('${caseItem.id}')">Delete</button>
    `;
    casesContainer.appendChild(caseElement);
  });
}

// Create a new Case
async function createCase(title, description) {
  try {
    const response = await axios.post('/api/cases', { title, description });
    fetchCases();
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Case created successfully',
    });
  } catch (error) {
    console.error('Error creating case:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to create case',
    });
  }
}

// Delete a Case
async function deleteCase(caseId) {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await axios.delete(`/api/cases/${caseId}`);
      fetchCases();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Case deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting case:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to delete case',
    });
  }
}

// Fetch and render Tasks
async function fetchTasks() {
  try {
    const response = await axios.get('/api/tasks');
    renderTasks(response.data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

function renderTasks(tasks) {
  const tasksContainer = document.getElementById('tasks-container');
  tasksContainer.innerHTML = '';
  tasks.forEach((taskItem) => {
    const taskElement = document.createElement('div');
    taskElement.innerHTML = `
      <h3>${taskItem.title}</h3>
      <p>${taskItem.description}</p>
      <button onclick="deleteTask('${taskItem.id}')">Delete</button>
    `;
    tasksContainer.appendChild(taskElement);
  });
}

// Create a new Task
async function createTask(title, description) {
  try {
    const response = await axios.post('/api/tasks', { title, description });
    fetchTasks();
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Task created successfully',
    });
  } catch (error) {
    console.error('Error creating task:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to create task',
    });
  }
}

// Delete a Task
async function deleteTask(taskId) {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Task deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to delete task',
    });
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  fetchCases();
  fetchTasks();
});
