// backend/controllers/ads.js
export const getAds = async (req, res) => {
  try {
    const ads = [
      {
        id: 1,
        brand: "Jumia",
        text: "Shop hot deals on Jumia!",
        link: "https://jumia.com.ng",
      },
      {
        id: 2,
        brand: "GTBank",
        text: "Bank easy with GTBank!",
        link: "https://gtbank.com",
      },
    ];
    res.json({ ads, message: "Ads dey here—check am!" });
  } catch (err) {
    res.status(500).json({ message: "Ads scatter: " + err.message });
  }
};
