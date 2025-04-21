const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb'); // to convert string id to ObjectId
const connectDB = require('../config/db');
const MiddleWareAuth = require('../middleware/MiddleWareAuth');



// ---------------------------------------------------------
// CREATE a new geocache
// Endpoint: POST /api/geocache
// Required fields in request body: 
//   - coordinates: an array [lat, lng]
//   - difficulty: e.g., "easy", "medium", "hard"
// Optional field: description
// The creator is determined by the authenticated user (req.user.id)
// ---------------------------------------------------------

router.post('/',MiddleWareAuth, async (req, res) => {
    const { coordinates, difficulty, description } = req.body;
    if (!coordinates || !difficulty) {
        return res.status(400).json({ message: 'Missing required fields: coordinates and difficulty are required. '});
    }
    try {
        const db = await connectDB();

        const geocache = {
            coordinates,
            difficulty,
            description: description || "",
            creator: req.user.id, // from JWT payload
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('geocaches').insertOne(geocache);
        res.status(201).json({message: 'Geocache created successfully', geocacheId: result.insertedId});
    } catch(err) {
        res.status(500).json({message: err.message});
    }
});

// ---------------------------------------------------------
// UPDATE an existing geocache
// Endpoint: PUT /api/geocache/:id
// Only the creator of the geocache can update it.
// ---------------------------------------------------------

router.put('/:id', MiddleWareAuth, async (req, res) => {
    const geocacheId = req.params.id;
    const{ coordinates, difficulty, description } = req.body;
    try{
        const db = await connectDB();
        // Find the existing geocache
        const geocache = await db.collection('geocaches').findOne({_id : new ObjectId(geocacheId)});
        if(!geocache){
            return res.status(404).json({message: 'geocache not found'});
        }
        
        // Check that the log user is the creator
        if(geocache.creator !== req.user.id ){
            return res.status(403).json({message: 'Unauthorized to edit this geocache'});
        }
        const update = {
            $set: {
                coordinates: coordinates || geocache.coordinates,
                difficulty: difficulty || geocache.difficulty,
                description: description !== undefined ? description : geocache.description,
                updatedAt: new Date()
            }
        };
        await db.collection('geocaches').updateOne({ _id: new ObjectId(geocacheId) }, update);
        res.json({ message: 'Geocache updated successfully' });
    } catch(err){
        res.status(500).json({message: err.message});
    }
});

// ---------------------------------------------------------
// DELETE a geocache
// Endpoint: DELETE /api/geocache/:id
// Only the creator of the geocache can delete it.
// ---------------------------------------------------------
router.delete('/:id', MiddleWareAuth, async (req, res) => {
    const geocacheId = req.params.id;
    try {
      const db = await connectDB();
      // Find the geocache to check ownership
      const geocache = await db.collection('geocaches').findOne({ _id: new ObjectId(geocacheId) });
      if (!geocache) {
        return res.status(404).json({ message: 'Geocache not found' });
      }
      if (geocache.creator !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized to delete this geocache' });
      }
      await db.collection('geocaches').deleteOne({ _id:  new ObjectId(geocacheId) });
      res.json({ message: 'Geocache deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
// ---------------------------------------------------------
// RETRIEVE geocaches
// Endpoint: GET /api/geocache
// This endpoint retrieves the list of geocaches.
// Optionally, you might filter geocaches based on proximity by
// reading query parameters (e.g., lat, lng, radius).
// ---------------------------------------------------------
router.get('/', MiddleWareAuth, async (req, res) => {
try {
    const db = await connectDB();
    const geocaches = await db.collection('geocaches').find().toArray();
    res.json(geocaches);
} catch (err) {
    res.status(500).json({ message: err.message });
}
});

// ----------------------------------------------------------
// COMMENT geocaches
// Endpoint : POST /api/geocache/:id/comment
// Adds a comment to a geocache.
// Requires JWT authentication.
// ----------------------------------------------------------
router.post('/:id/comment', MiddleWareAuth, async (req, res) => {
    const geocacheId = req.params.id;
    const {comment} = req.body;

    if (!comment) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try{
        const db = await connectDB();
        const geocache = await db.collection('geocaches').findOne({_id: new ObjectId(geocacheId)});
        if (!geocache) {
            return res.status(404).json({ message: 'Geocache not found' });
        }

        // Build the comment object including the ID of the user making the comment and a timestamp.
        const commentObj = {
            commenter: req.user.id,
            comment: comment,
            commentedAt: new Date()
        };

        // Update the geocache document by pushing the new comment into the comments array.
        // If the comments array doesn't exist, MongoDB will create it.
        const update = { $push: { comments: commentObj } };
        await db.collection('geocaches').updateOne({ _id: new ObjectId(geocacheId) }, update);

        res.json({ message: 'Comment added successfully' });
    } catch (err){
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------
// RETRIEVE a specific geocache
// Endpoint: GET /api/geocache/:id
// This endpoint retrieves a specific geocache by its ID.
// ---------------------------------------------------------
router.get('/:id', MiddleWareAuth, async (req, res) => {
    const geocacheId = req.params.id;
    
    try {
      const db = await connectDB();
      const geocache = await db.collection('geocaches').findOne({ _id: new ObjectId(geocacheId) });
      
      if (!geocache) {
        return res.status(404).json({ message: 'Géocache non trouvée' });
      }
      
      res.json(geocache);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


module.exports = router;
