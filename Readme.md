# dev-dependency 
- `nodemon` - A utility that automatically restarts the server when file changes are detected, improving development workflow.
  

# prettier
Prettier is an opinionated code formatter that helps maintain a consistent style across the codebase. It automatically formats code according to a set of rules, making it easier to read and maintain. By using Prettier, developers can focus on writing code without worrying about formatting issues, as Prettier will handle it for them. This leads to cleaner code and a more efficient development process.


# mongoose-aggregate-paginate-v2
`mongoose-aggregate-paginate-v2` is a pagination plugin for Mongoose that allows developers to easily paginate results from MongoDB aggregate queries. It provides a simple interface for paginating results, making it easier to manage large datasets and improve performance when retrieving data from the database. By using this plugin, developers can efficiently handle pagination in their applications without having to implement custom pagination logic.
   i used it in video.model.js to paginate the videos when fetching them from the database.

# bcrypt
`bcrypt` is a popular library used for hashing passwords in Node.js applications. It provides a secure way to store user passwords by hashing them before saving to the database. When a user logs in, the application can compare the hashed password with the stored hash to authenticate the user. Using `bcrypt` helps protect user data and enhances the security of the application by making it difficult for attackers to retrieve original passwords even if they gain access to the database.

   i used it in user.model.js to hash the user's password before saving it to the database and to compare the hashed password with the original password when the user tries to log in.


# jsonwebtoken
`jsonwebtoken` is a library used for creating and verifying JSON Web Tokens (JWTs) in Node.js applications. JWTs are a compact, URL-safe means of representing claims to be transferred between two parties. They are commonly used for authentication and authorization purposes. With `jsonwebtoken`, developers can generate tokens that contain user information and securely transmit them between the client and server. The library also provides methods for verifying the authenticity of the tokens, ensuring that only valid tokens are accepted for accessing protected resources.
   i used it in auth.controller.js to generate JWT tokens for user authentication and authorization. 

jwt is a bearer token yani ki ye password ki tarah hota hai, jab user login karta hai to server usko ek token deta hai jo ki uske credentials ko represent karta hai. Jab user kisi protected route ko access karta hai to wo token ko header me bhejta hai aur server us token ko verify karta hai. Agar token valid hota hai to user ko access mil jata hai otherwise access denied hota hai.

