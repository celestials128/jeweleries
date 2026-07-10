package com.celestials.service;

import com.celestials.model.Blog;
import com.celestials.model.User;
import com.celestials.repository.BlogRepository;
import com.celestials.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BlogService {
    @Autowired
    private BlogRepository blogRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Blog> getPublishedBlogs() {
        return blogRepository.findByPublishedTrueOrderByCreatedAtDesc();
    }

    public List<Blog> getAllBlogs() {
        return blogRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Blog> getBlogById(Long id) {
        return blogRepository.findById(id);
    }

    public Blog createBlog(Blog blog, Long authorId) {
        Optional<User> author = userRepository.findById(authorId);
        if (author.isPresent()) {
            blog.setAuthor(author.get());
            return blogRepository.save(blog);
        }
        throw new RuntimeException("Author not found");
    }

    public Blog updateBlog(Long id, Blog blogDetails) {
        Optional<Blog> blog = blogRepository.findById(id);
        if (blog.isPresent()) {
            Blog existingBlog = blog.get();
            existingBlog.setTitle(blogDetails.getTitle());
            existingBlog.setContent(blogDetails.getContent());
            existingBlog.setExcerpt(blogDetails.getExcerpt());
            existingBlog.setPublished(blogDetails.getPublished());
            return blogRepository.save(existingBlog);
        }
        throw new RuntimeException("Blog not found");
    }

    public void deleteBlog(Long id) {
        blogRepository.deleteById(id);
    }
}
