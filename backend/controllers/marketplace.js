import Listing from "../models/listing.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import { v4 as uuidv4 } from "uuid";

// Hardcode here for now, could move to a config file later
const categories = [
  "Electronics",
  "Fashion",
  "Home",
  "Food",
  "Services",
  "Others",
];

export const createListing = async (req, res) => {
  const { title, description, price, category } = req.body;
  try {
    if (!title || !description || !price) {
      return res.status(400).json({ message: "Abeg, fill all fields!" });
    }
    const listing = new Listing({
      title,
      description,
      price: price * 100, // ₦ to kobo
      userId: req.user._id,
      category: category || "Others",
    });
    await listing.save();
    res.status(201).json({ message: "Item posted—market dey hot!", listing });
  } catch (err) {
    res.status(500).json({ message: "Listing scatter: " + err.message });
  }
};

export const getListings = async (req, res) => {
  try {
    // const listings = await Listing.find({ status: "active" }) // Show active
    const listings = await Listing.find({
      status: { $in: ["active", "pending"] },
    }) // Show active and pending
      .populate("userId", "email flair")
      .sort({ createdAt: -1 });
    res.json({ listings, message: "Market items dey here—check am!" });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id).populate(
      "userId",
      "email flair"
    );
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    res.json({ listing, message: "Item found—check am out!" });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category } = req.body;
  try {
    const listing = await Listing.findById(id);
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No be your item—abeg comot!" });
    }
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price ? price * 100 : listing.price;
    listing.category = category || listing.category;
    await listing.save();
    res.json({ message: "Item updated—market still dey hot!", listing });
  } catch (err) {
    res.status(500).json({ message: "Update scatter: " + err.message });
  }
};

export const deleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id);
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    if (
      listing.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "No be your item—abeg comot!" });
    }
    listing.status = "deleted";
    await listing.save();
    res.json({ message: "Item don waka—deleted!" });
  } catch (err) {
    res.status(500).json({ message: "Delete scatter: " + err.message });
  }
};

export const getCategories = (req, res) => {
  try {
    res.json({ categories, message: "Categories dey here—pick one!" });
  } catch (err) {
    res.status(500).json({ message: "Categories scatter: " + err.message });
  }
};

export const buyListing = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Buy Attempt:", { id, user: req.user._id });
    const listing = await Listing.findById(id);
    console.log("Listing:", listing);
    if (!listing || listing.status !== "active") {
      return res.status(400).json({ message: "Item no dey or e don waka!" });
    }
    const buyerWallet = await Wallet.findOne({ userId: req.user._id });
    console.log("Wallet:", buyerWallet);
    if (!buyerWallet || buyerWallet.balance < listing.price) {
      return res.status(400).json({ message: "Oga, your wallet no reach!" });
    }

    buyerWallet.balance -= listing.price;
    await buyerWallet.save();
    console.log("Wallet Updated:", buyerWallet);

    const transaction = new Transaction({
      senderId: req.user._id,
      receiverId: listing.userId,
      amount: listing.price,
      type: "escrow",
      status: "pending",
      reference: uuidv4(), // Unique per transaction
    });
    await transaction.save();
    console.log("Transaction:", transaction);

    listing.status = "pending";
    listing.buyerId = req.user._id;
    listing.transactionId = transaction._id;
    await listing.save();
    console.log("Listing Updated:", listing);

    res.json({ message: "Item dey hold—escrow don start!", listing });
  } catch (err) {
    console.error("Buy Error:", err);
    res.status(500).json({ message: "Buy scatter: " + err.message });
  }
};
