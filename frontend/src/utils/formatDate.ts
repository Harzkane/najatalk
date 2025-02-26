// frontend/src/utils/formatDate.ts

/**
 * Formats a date string into the forum format: "11:59am On Feb 26, 2025"
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
  
    // Format time (12:00am/pm format)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12am
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes}${ampm}`;
  
    // Format date (Month Day, Year)
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
  
    return `${timeString} On ${month} ${day}, ${year}`;
  };
  
  export default formatDate;