if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

// import the model
const Note = require("./models/note");

// use cors (cross origin resource sharing)
const cors = require("cors");

app.use(cors());

// display front end from static files
app.use(express.static("dist"));

// use json parser
app.use(express.json());

// middleware
const requestLogger = (req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:  ", req.path);
  console.log("Body:  ", req.body);
  console.log("---");
  next();
};

// hardcode some data to send
let notes = [
  {
    id: 1,
    content: "HTML is easy",
    important: true,
  },
  {
    id: 2,
    content: "Browser can execute only JavaScript",
    important: false,
  },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
  {
    id: 4,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
];

app.get("/", (request, response) => {
  response.send("<h1>Hello world!</h1>");
});

// get all notes
app.get("/api/notes", (request, response) => {
  //response.json(notes);

  // use mongoose
  Note.find({}).then((notes) => {
    response.json(notes);
  });
});

// create a note
// save the data to the db
// pass errors to error handler
app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({
      error: "content missing",
    });
  }

  // create a new note object
  const note = new Note({
    content: body.content,
    important: body.important || false,
  });

  // save the note
  //notes = notes.concat(note);
  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((error) => next(error));

  //console.log(note);
  //response.json(note);
});

// get one note
// get from mongoose
app.get("/api/notes/:id", (request, response, next) => {
  //   const id = Number(request.params.id);
  //   const note = notes.find((note) => note.id === id);

  //   if (note) {
  //     response.json(note
  //   } else {
  //     response.status(404).end();
  //   }

  // send 404 error back if the note id doesn't exist
  // pass any errors to error handling middleware
  Note.findById(request.params.id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// function to generate id for notes - no longer used
const generateId = () => {
  const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
  return maxId + 1;
};

// delete a note
// use findByIdAndRemove
app.delete("/api/notes/:id", (request, response, next) => {
  //   const id = Number(request.params.id);
  //   notes = notes.filter((note) => note.id !== id);

  //   response.status(204).end();

  Note.findByIdAndRemove(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

// update a note
app.put("/api/notes/:id", (request, response, next) => {
  //const body = request.body;
  const { content, important } = request.body;
  // const note = {
  //   content: body.content,
  //   important: body.important,
  // };

  // add validation when updating since it is not run by default
  Note.findByIdAndUpdate(
    request.params.id,
    { content, important },
    { new: true, runValidators: true, context: "query" }
  )
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => next(error));
});

// unknown endpoint middleware
// this should come after the routes
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

// make an error handling middleware
// this should be the last middleware loaded
// handle validation errors
const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformed id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT);
console.log(`running on port ${PORT}`);
