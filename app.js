const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const Listing = require("./models/listing.js")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressErrors.js");
const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

app.get("/", wrapAsync(async(req, res) => {
    // res.send("Hi, I am root");
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
}));

// New Route 
app.get("/listings/new", (req, res) => {
    res.render("./listings/new.ejs");
})

// Create Route
app.post("/listings", wrapAsync(async (req, res, next) => {

    listingSchema.validate(req.body);
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
    // if (!newListing.title) {
    //     throw new ExpressError(400, "Title is missing");
    // }
    // if (!newListing.description) {
    //     throw new ExpressError(400, "Description is missing");
    // }
    // if (!newListing.price) {
    //     throw new ExpressError(400, "Price is missing");
    // }
    // if (!newListing.location) {
    //     throw new ExpressError(400, "Loaction is missing");
    // }
    // if (!newListing.country) {
    //     throw new ExpressError(400, "Country is missing");
    // }
}))

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// Index Route
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
}))

// Delete Route
app.post("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}))

// Show/Read Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("./listings/show.ejs", { listing });
}))

// Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", { listing });
}))

// Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data for listing");
    }
    let listing = await Listing.findById(req.params.id);
    const { id } = req.params;
    const updatedListing = req.body.listing;
    await Listing.findByIdAndUpdate(id, updatedListing);
    res.redirect(`/listings/${listing._id}`);

    // try {
    //     const { id } = req.params;
    //     const updatedListing = req.body.listing; // Assuming your form sends data as { listing: { title, description, image, price, location, country } }

    //     // Make sure to await the update operation
    //     await Listing.findByIdAndUpdate(id, updatedListing);

    //     // Redirect after the update operation is complete
    //     res.redirect("/listings");
    // } catch (error) {
    //     console.error("Error updating listing:", error);
    //     res.status(500).send("Internal Server Error");
    // }
}));

// Review - Post Route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    reviewSchema.validate(req.body);
    const newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`/listings/${listing._id}`);
}))

// Review - Delete Route 
app.delete("listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    let { id, reviewID } = req.params;

    await Review.findByIdAndDelete(reviewID);
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewID} });

    res.redirect("/listings/:id");
}))

app.use((err, req, res, next) => {
    let { statusCode, message } = err;
    res.status(statusCode || 500).render("error.ejs", { message });
});


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
})

app.use((err, req, res, next) => {
    let { statusCode, message } = err;
    res.render("error.ejs");
    // res.status(statusCode).send(message);
    // res.send("Something went wrong!");
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the Beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successsful");
// });