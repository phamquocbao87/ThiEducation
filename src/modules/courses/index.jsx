import React from 'react';
import { useParams } from 'react-router-dom';
import { CoursesPage } from './CoursesPage';
import { CourseCreationPage } from './CourseCreationPage';

export default function CoursesModule() {
  const { action } = useParams();
  if (action === 'new' || action === 'create') {
    return <CourseCreationPage />;
  }
  return <CoursesPage />;
}

export { CoursesPage, CourseCreationPage };

