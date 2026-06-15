import { CourseDetailView } from './components/CourseDetailView';

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CourseDetailView courseId={params.id} />;
}
