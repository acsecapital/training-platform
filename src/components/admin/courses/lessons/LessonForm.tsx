import React, {useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import {Lesson, LessonType, QuizQuestion as QuizQuestionType } from '@/types/course.types';
import ContentEditor from '@/components/ui/ContentEditor';
import QuizEditor from '@/components/ui/QuizEditor';
import VideoPlayer from '@/components/ui/VideoPlayer';

// Import the rich text editor with SSR disabled
const RichTextEditor = dynamic(
  () => import('@/components/admin/common/RichTextEditor'),
  {ssr: false }
);

interface LessonFormProps {
  initialData?: Partial<Lesson> & {questions?: QuizQuestionType[] };
  onSubmit: (data: Partial<Lesson> & {questions?: QuizQuestionType[] }) => Promise<void>;
  courseId: string;
  moduleId: string;
  isEditing?: boolean;
}

const LessonForm: React.FC<LessonFormProps> = ({
  initialData = {title: '', type: 'text', content: '', status: 'draft'},
  onSubmit,
  courseId,
  moduleId,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    ...initialData,
    questions: (initialData as any).questions || []
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value, type } = e.target;

    // Handle numeric inputs (like duration)
    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : parseInt(value, 10) || 0,
    }));
  } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
    }));
  }
};

  // Handle lesson type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'video' | 'text' | 'quiz';
    setFormData((prev) => ({
      ...prev,
      type: newType,
      // Reset type-specific fields when changing types
      ...(newType !== 'video' && {videoId: undefined }),
  }));
};

  // Handle rich text editor content change
  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
  }));
};

  // Handle quiz questions change
  const handleQuestionsChange = (questions: QuizQuestionType[]) => {
    setFormData((prev) => ({
      ...prev,
      questions,
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Update status based on publish parameter
      const dataToSubmit = {
        ...formData,
        status: publish ? 'published' as const : 'draft' as const,
    };

      await onSubmit(dataToSubmit);
  } catch (err: any) {
      console.error('Error submitting lesson:', err);
      setError(err.message || 'Failed to save lesson. Please try again.');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Lesson Information */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter lesson title"
              />
            </div>

            {/* Lesson Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">
                Lesson Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="text">Text</option>
                <option value="video">Video</option>
                <option value="quiz">Quiz</option>
              </select>
              <p className="mt-1 text-sm text-neutral-500">
                {formData.type === 'text' && 'Text lessons contain rich text content with formatting, images, and links.'}
                {formData.type === 'video' && 'Video lessons embed a video from Cloudflare Stream with optional text content.'}
                {formData.type === 'quiz' && 'Quiz lessons contain questions to test student knowledge.'}
              </p>
            </div>

            {/* Video-specific fields */}
            {formData.type === 'video' && (
              <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                <h3 className="text-md font-medium text-neutral-900">Video Settings</h3>

                <div>
                  <label htmlFor="videoId" className="block text-sm font-medium text-neutral-700 mb-1">
                    Cloudflare Stream Video ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="videoId"
                    name="videoId"
                    value={formData.videoId || ''}
                    onChange={handleInputChange}
                    required={formData.type === 'video'}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter Cloudflare Stream Video ID"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Example: For <code>https://cloudflarestream.com/abc123/watch</code>, the ID is <code>abc123</code>.
                  </p>
                </div>

                {formData.videoId && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Video Preview
                    </label>
                    <div className="border border-neutral-300 rounded-md overflow-hidden">
                      <VideoPlayer
                        videoId={formData.videoId}
                        onDurationChange={(duration) => {
                          setFormData(prev => ({
                            ...prev,
                            duration: Math.round(duration)
                        }));
                      }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-neutral-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter video duration in seconds"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    This will be automatically updated when you preview the video.
                  </p>
                </div>
              </div>
            )}

            {/* Quiz-specific fields */}
            {formData.type === 'quiz' && (
              <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                <h3 className="text-md font-medium text-neutral-900">Quiz Questions</h3>

                <p className="text-sm text-neutral-500 mb-4">
                  Add questions to your quiz. Students will need to answer these questions correctly to complete the lesson.
                </p>

                <QuizEditor
                  initialQuestions={(formData.questions) || []}
                  onChange={handleQuestionsChange}
                />
              </div>
            )}

            {/* Duration field for text and quiz lessons */}
            {formData.type !== 'video' && (
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter estimated completion time in seconds"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  {formData.type === 'text'
                    ? 'Estimated reading time in seconds.'
                    : 'Estimated time to complete the quiz in seconds.'}
                </p>
              </div>
            )}

            {/* Status field */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'draft'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="mt-1 text-sm text-neutral-500">
                Draft lessons are only visible to admins. Published lessons are visible to students.
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-1">
                Content {formData.type !== 'quiz' && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1">
                <ContentEditor
                  initialValue={formData.content || ''}
                  onChange={handleContentChange}
                  height={400}
                  editorType={formData.type === 'quiz' ? 'basic' : 'standard'}
                  storagePath={`courses/${courseId}/modules/${moduleId}/lessons/${formData.id || 'new'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row-reverse sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit(new Event('click') as unknown as React.FormEvent, true)}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Save & Publish' : 'Create & Publish'}
            </Button>

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
            >
              {isEditing ? 'Save as Draft' : 'Create as Draft'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LessonForm;
