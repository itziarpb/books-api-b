const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: true }));

var permissions = require("./permissions.json");
admin.initializeApp({
    credential: admin.credential.cert(permissions),
    databaseURL: "http://localhost:5000/books-api-5cd8f/us-central1/app"
});

const db = admin.firestore();

//ENPOINTS

//Creamos un post con los datos del libro y un id generado automaticamente
app.post('/books', (req, res) => {
    (async () => {
        try {
            const { titulo, autor, genero } = req.body;
            if (!titulo || !autor || !autor) {
                return res.status(400).json({ error: 'Todos los datos son requeridos' });
            }
            const newBook = await db.collection('books').add({
                titulo,
                autor,
                genero
            });
            const newBookId = newBook.id;
            return res.status(201).json({ message: 'Libro creado correctamente' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    })();
});

//Creamos un get que obtenga todos los libros almacenados
app.get("/books", async (req, res) => {
    try {
        let query = db.collection("books");
        const querySnapshot = await query.get();
        let docs = querySnapshot.docs;

        const response = docs.map((doc) => ({
            id: doc.id,
            titulo: doc.data().titulo,
            autor: doc.data().autor,
            genero: doc.data().genero
        }));

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
})

//Creamos un get que obtenga un libro especifico
app.get("/books/:bookId", async (req, res) => {
    (async () => {
        try {
            const bookRef = db.collection('books').doc(req.params.bookId);
            const book = await bookRef.get()

            if (!book.exists) {
                return res.status(404).json({ error: 'Book not found' });
            }

            const response = book.data();
            return res.status(200).json(response)
        } catch (error) {
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    })();
})

//Creamos un put que modifique los datos de un libro ya existente
app.put('/books/:bookId', async (req, res) => {
    try {
        const { titulo, autor, genero } = req.body;

        const bookRef = db.collection('books').doc(req.params.bookId);
        const book = await bookRef.get()

        if (!book.exists) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        const updateData = {};
        if (titulo) updateData.titulo = titulo;
        if (autor) updateData.autor = autor;
        if (genero) updateData.genero = genero;

        await bookRef.update(updateData);

        return res.status(200).json({ message: 'Libro modificado correctamente.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//Creamos un delete que elimine un libro especifico
app.delete('/books/:bookId', async (req, res) => {
    try {
        const bookRef = db.collection('books').doc(req.params.bookId);
        const book = await bookRef.get()

        if (!book.exists) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        // Eliminar el libro
        await bookRef.delete();

        return res.status(200).json({ message: 'Libro borrado correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});






app.get('/holamundo', (req, res) => {
    return res.status(200).send('Hola mundo, soy el primer endpoint');
});

exports.app = functions.https.onRequest(app);