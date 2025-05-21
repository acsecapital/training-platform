import React, {useState, useEffect } from 'react';
import {Lesson, LessonType } from '@/types/course.types';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import ContentEditor from '@/components/ui/ContentEditor';
import QuizEditor from '@/components/ui/QuizEditor';
import VideoPlayer from '@/components/ui/VideoPlayer';

// Import the rich text editor with dynamic import to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="border border-neutral-300 rounded-md p-4 h-64 bg-neutral-50 flex items-center justify-center">
        Loading editor...
      </div>
    ),
}
);

interface LessonFormProps {
  initialData: Partial<Lesson>;
  onSubmit: (lessonData: Partial<Lesson>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const LessonForm: React.FC<LessonFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Lesson>>(initialData);
  const [error, setError] = useState<string | null>(null);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const {name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
  }));
};

  // Handle number input change
  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
  }));
};

  // Handle rich text content change
  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
  }));
};

  // Handle lesson type change
  const handleTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const type = e.target.value as LessonType;
    setFormData((prev) => ({
      ...prev,
      type,
      // Reset content when changing type
      content: type === 'text' ? prev.content : '',
      videoId: type === 'video' ? prev.videoId : '',
      quizQuestions: type === 'quiz' ? prev.quizQuestions : [],
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    // Validate form
    if (!formData.title?.trim()) {
      setError('Lesson title is required');
      return;
  }

    try {
      setError(null);

      // Ensure status is properly typed
      const dataToSubmit: Partial<Lesson> = {
        ...formData,
        status: (formData.status as 'draft' | 'published') || 'draft',
        type: (formData.type as LessonType) || 'text',
    };

      await onSubmit(dataToSubmit);
  } catch (err: any) {
      console.error('Error submitting lesson:', err);
      setError(
        err.message || 'Failed to save lesson. Please try again.'
      );
  }
};

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">
          {initialData.id ? 'Edit Lesson' : 'Add New Lesson'}
        </h2>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter lesson title"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter lesson description"
          />
        </div>

        {/* Lesson Type */}
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Lesson Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type || 'text'}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="text">Text</option>
            <option value="video">Video</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        {/* Content based on lesson type */}
        {formData.type === 'text' && (
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Content
            </label>
            <ContentEditor
              initialValue={formData.content || ''}
              onChange={handleContentChange}
              height={400}
              editorType="standard"
              storagePath={`courses/lessons/${formData.id || 'new'}`}
            />
          </div>
        )}

        {formData.type === 'video' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="videoId"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Video ID (Cloudflare Stream) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="videoId"
                name="videoId"
                value={formData.videoId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter Cloudflare Stream video ID"
                required
              />
              <p className="mt-1 text-sm text-neutral-500">
                Enter the Cloudflare Stream video ID. You can find this in your Cloudflare Stream dashboard.
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
                      setFormData((prev) => ({
                        ...prev,
                        duration: Math.round(duration),
                    }));
                  }}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Duration (seconds)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration || 0}
                onChange={handleNumberChange}
                min={0}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter video duration in seconds"
              />
              <p className="mt-1 text-sm text-neutral-500">
                This will be automatically updated when you preview the video.
              </p>
            </div>

            {/* Video Notes Editor */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Video Notes
              </label>
              <p className="text-sm text-neutral-500 mb-2">
                Add additional content below the video, such as transcripts, supplementary materials, or instructions.
              </p>
              <ContentEditor
                initialValue={formData.content || ''}
                onChange={handleContentChange}
                height={300}
                editorType="standard"
                storagePath={`courses/lessons/${formData.id || 'new'}`}
              />
            </div>
          </div>
        )}

        {formData.type === 'quiz' && (
          <div>
            <label
              htmlFor="quizQuestions"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Quiz Questions
            </label>
            <div className="border border-neutral-300 rounded-md p-4 bg-white">
              <QuizEditor
                initialQuestions={formData.quizQuestions || []}
                onChange={(questions) => {
                  setFormData((prev) => ({
                    ...prev,
                    quizQuestions: questions,
                }));
              }}
              />
            </div>
          </div>
        )}

        {/* Duration (for text and quiz lessons) */}
        {formData.type !== 'video' && (
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Duration (seconds)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration || 0}
              onChange={handleNumberChange}
              min={0}
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

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || 'draft'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="mt-1 text-sm text-neutral-500">
            Draft lessons are only visible to admins. Published lessons are visible to students.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row-reverse sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : initialData.id
              ? 'Update Lesson'
              : 'Create Lesson'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LessonForm;