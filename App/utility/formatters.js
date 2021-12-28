exports.formatName = (value) => {
  const words = value.trim().split(/\s+/);
  const capitalizeWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  return capitalizeWords.join(' ');
};
