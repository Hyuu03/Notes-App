import "./styles/styles.css";
import { notesData } from "../notes.js";

class AppBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <h1>Notes App</h1>
        <div class="menu">
          <button id="view-all-btn" class="menu-btn">View All</button>
          <button id="view-archived-btn" class="menu-btn">View Archived</button>
        </div>
      </header>
    `;

    this.querySelector("#view-all-btn").addEventListener(
      "click",
      this.handleViewAll.bind(this),
    );
    this.querySelector("#view-archived-btn").addEventListener(
      "click",
      this.handleViewArchived.bind(this),
    );
  }

  handleViewAll() {
    document.querySelector("note-list").fetchNotes();
  }

  handleViewArchived() {
    document.querySelector("note-list").fetchArchivedNotes();
  }
}

class NoteList extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="notes-list">
        <div id="loading-spinner" class="loader"></div>
      </section>
    `;
    this.fetchNotes();
  }

  async fetchNotes(archived = false) {
    const notesList = this.querySelector(".notes-list");
    const loadingSpinner = this.querySelector("#loading-spinner");

    try {
      // Tampilkan indikator loading sebelum memuat catatan
      if (loadingSpinner) {
        loadingSpinner.style.display = "block";
      }

      const url = archived
        ? "https://notes-api.dicoding.dev/v2/notes/archived"
        : "https://notes-api.dicoding.dev/v2/notes";
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        notesList.innerHTML = data.data
          .map(
            (note) => `
          <note-item 
            title="${note.title}" 
            body="${note.body}" 
            createdAt="${note.createdAt}"
            id="${note.id}"
            archived="${note.archived}"
          ></note-item>
        `,
          )
          .join("");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error fetching notes:", error.message);
    } finally {
      // Simulasikan penundaan sebelum menyembunyikan indikator loading
      setTimeout(() => {
        // Sembunyikan indikator loading setelah memuat catatan selesai
        if (loadingSpinner) {
          loadingSpinner.style.display = "none";
        }
      }, 2000); // Penundaan 2000 milidetik (2 detik)
    }
  }

  fetchArchivedNotes() {
    this.fetchNotes(true); // Set archived to true
  }
}

class NoteItem extends HTMLElement {
  connectedCallback() {
    const archived = this.getAttribute("archived") === "true";
    const archiveText = archived ? "Unarchive" : "Archive";
    this.innerHTML = `
      <div class="note-item" data-custom="example">
        <h2>${this.getAttribute("title")}</h2>
        <p>${this.getAttribute("body")}</p>
        <small>${new Date(this.getAttribute("createdAt")).toLocaleString()}</small>
        <button class="archive-btn">${archiveText}</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    this.querySelector(".archive-btn").addEventListener(
      "click",
      this.handleArchive.bind(this),
    );
    this.querySelector(".delete-btn").addEventListener(
      "click",
      this.handleDelete.bind(this),
    );
  }

  async handleArchive() {
    const noteId = this.getAttribute("id");
    const isArchived = this.getAttribute("archived") === "true";
    const action = isArchived ? "unarchive" : "archive";

    try {
      const response = await fetch(
        `https://notes-api.dicoding.dev/v2/notes/${noteId}/${action}`,
        { method: "POST" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      } else {
        console.log(`Note ${action}d successfully`);
        // Update note list after archiving/unarchiving
        document.querySelector("note-list").fetchNotes();
      }
    } catch (error) {
      console.error(`Error ${action}ing note:`, error.message);
    }
  }

  async handleDelete() {
    const noteId = this.getAttribute("id");

    try {
      const response = await fetch(
        `https://notes-api.dicoding.dev/v2/notes/${noteId}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      } else {
        console.log("Note deleted successfully");
        // Update note list after deleting note
        document.querySelector("note-list").fetchNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error.message);
    }
  }
}

class NoteForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="note-form">
        <h2>Add New Note</h2>
        <form id="new-note-form">
          <input type="text" id="note-title" placeholder="Title" required>
          <textarea id="note-body" placeholder="Body" required></textarea>
          <button type="submit">Add Note</button>
        </form>
      </section>
    `;

    const form = this.querySelector("#new-note-form");
    form.addEventListener("submit", this.handleFormSubmit.bind(this));
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const title = event.target.elements["note-title"].value;
    const body = event.target.elements["note-body"].value;

    try {
      const response = await fetch("https://notes-api.dicoding.dev/v2/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      } else {
        console.log("Note added successfully");
        // Fetch and render notes after adding a new note
        document.querySelector("note-list").fetchNotes();
        event.target.reset();
      }
    } catch (error) {
      console.error("Error adding note:", error.message);
    }
  }
}

customElements.define("app-bar", AppBar);
customElements.define("note-list", NoteList);
customElements.define("note-item", NoteItem);
customElements.define("note-form", NoteForm);
