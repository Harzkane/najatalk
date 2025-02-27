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
      // add more ads here
      {
        id: 3,
        brand: "Konga",
        text: "Konga—your online mall!",
        link: "https://konga.com",
      },
      {
        id: 4,
        brand: "Polaris Bank",
        text: "Simple banking with Polaris!",
        link: "https://polarisbank.com",
      },
    ];
    res.json({ ads, message: "Ads dey here—check am!" });
  } catch (err) {
    res.status(500).json({ message: "Ads scatter: " + err.message });
  }
};
