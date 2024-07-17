//This file is an Express router module that defines several routes for interacting with a MongoDB collection using the Mongoose ORM.

const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  if (!request.user) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(request.user.id)
  const blog = new Blog({
    ...body,
    user: user._id
  })
  if (!blog.url || !blog.title) {
    response.status(400).end()
  }
  if (!blog.likes) blog.likes = 0

  const addedBlog = await blog.save()
  user.blogs = user.blogs.concat(addedBlog._id) // user.blogs is the array of blogs the user has posted, the just posted blog id is added using concat or spread operator to generat new array, does not change existing array
  await user.save()

  response.status(201).json(addedBlog)
})

blogsRouter.get('/:id', async (request, response) => {
  const indivitualBlog = await Blog.findById(request.params.id)
  response.json(indivitualBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!request.token) {
    response.status(401).json({ error: 'missing token, please login' })
  }
  const userid = request.user.id

  if (!(blog.user.toString() === userid.toString())) {
    response
      .status(401)
      .json({ error: 'You do not have permission to delete this blog post' })
  }
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }
  const blogToUpdate = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true
  })
  response.json(blogToUpdate)
})

module.exports = blogsRouter
