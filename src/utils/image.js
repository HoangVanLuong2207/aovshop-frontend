export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (path.startsWith('http')) return path;
    // Fallback to local upload path
    return `http://localhost:3000/uploads/${path}`;
};
