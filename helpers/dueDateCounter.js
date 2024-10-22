function daysLeftUntilDueDate(dateString) {
  const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])-\d{4}$/;

  if (!regex.test(dateString)) {
    throw new Error("Date should be in MM-DD-YYYY format");
  }

  const dateParts = dateString.split("-");
  const month = parseInt(dateParts[0], 10) - 1;
  const day = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  const inputDate = new Date(year, month, day);
  inputDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (
    inputDate.getFullYear() === year &&
    inputDate.getMonth() === month &&
    inputDate.getDate() === day
  ) {
    if (inputDate < currentDate) {
      return dateString;
    } else {
      const differenceInDays = Math.round(
        (inputDate - currentDate) / (1000 * 3600 * 24)
      );

      if (differenceInDays === 0) {
        return "Due date is today";
      } else {
        return `${differenceInDays} day${differenceInDays > 1 ? "s" : ""} left`;
      }
    }
  } else {
    throw new Error("Invalid date");
  }
}


export default daysLeftUntilDueDate;
