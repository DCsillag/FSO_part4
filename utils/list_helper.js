const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const total = (total, blog) => {
        return total + blog.likes
    }

    return blogs.reduce(total, 0)
}

const favourite = (blogs) => {
    return blogs.reduce((max, blog) => max.likes > blog.likes ? max : blog);
};

const mostBlogs = (blogs) => {
    if (blogs.length === 0) return null
  
    // Count blogs per author
    const authorCounts = blogs.reduce((counts, blog) => {
      counts[blog.author] = (counts[blog.author] || 0) + 1
      return counts
    }, {})
    // console.log(authorCounts)
  
    // Find author with max blogs
    let topAuthor = null
    let maxBlogs = 0
  
    for (const [author, blogs] of Object.entries(authorCounts)) {
      if (blogs > maxBlogs) {
        maxBlogs = blogs
        topAuthor = author
      }
    }
  
    return { author: topAuthor, blogs: maxBlogs };
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) return null

    // Count likes per author
    const likeCount = blogs.reduce((counts, blog) => {
        counts[blog.author] = (counts[blog.author] || 0) + blog.likes
        return counts
    }, {})

    // console.log(likeCount)

    let topAuthor = null
    let maxLikes = 0

    for (const [author, likes] of Object.entries(likeCount)) {
        if (likes > maxLikes) {
            maxLikes = likes
            topAuthor = author
        }
    }

    return { author: topAuthor, likes: maxLikes }
}

module.exports = {
    dummy,
    totalLikes,
    favourite,
    mostBlogs,
    mostLikes
}