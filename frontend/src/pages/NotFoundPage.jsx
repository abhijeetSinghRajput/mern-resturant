import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl md:text-3xl font-medium tracking-tight">
        404 | This page could not be found.
      </h1>
      <Link to="/" className="mt-6 text-sm underline underline-offset-4">
        Go back home
      </Link>
    </div>
  );
};

export default NotFoundPage;
