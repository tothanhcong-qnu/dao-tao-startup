import ExamDetailView from './components/ExamDetailView';

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  return <ExamDetailView examId={params.id} />;
}
