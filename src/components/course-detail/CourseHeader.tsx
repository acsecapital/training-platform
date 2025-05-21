import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import VideoPlayer from '@/components/video-player/VideoPlayer';

interface Instructor {
  name: string;
  title: string;
  avatar: string;
}

interface CourseHeaderProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  duration: string;
  modules: number;
  rating: number;
  reviewCount: number;
  enrolledCount: number;
  instructor: Instructor;
  price: number;
  introVideoId?: string;
  isEnrolled?: boolean;
  progress?: number;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  id,
  title,
  description,
  thumbnail,
  level,
  duration,
  modules,
  rating,
  reviewCount,
  enrolledCount,
  instructor,
  price,
  introVideoId,
  isEnrolled = false,
  progress = 0,
}) => {
  return (
    <section className="bg-gradient-primary py-16 text-white">
      <div className="container-custom mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Course Info */}
          <div className="w-full md:w-1/2">
            <div className="flex items-center mb-4">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                level === 'Beginner' ? 'bg-green-100 text-green-800' :
                level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
            }`}>
                {level}
              </span>
              <span className="ml-3 text-sm opacity-80">{duration} • {modules} modules</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
            
            <p className="text-lg mb-6 opacity-90">{description}</p>
            
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <span className="text-yellow-300 mr-1">★</span>
                <span>{rating}</span>
              </div>
              <span className="mx-2 opacity-60">|</span>
              <span>{reviewCount} reviews</span>
              <span className="mx-2 opacity-60">|</span>
              <span>{enrolledCount} students enrolled</span>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  width={'40'}
                  height={'40'}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{instructor.name}</p>
                <p className="text-sm opacity-80">{instructor.title}</p>
              </div>
            </div>
            
            {isEnrolled ? (
              <div className="space-y-4">
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5 mb-1">
                  <div 
                    className="bg-white h-2.5 rounded-full" 
                    style={{width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{progress}% complete</span>
                  <Link 
                    href={`/courses/${id}/learn`}
                    className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Continue Learning
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-neutral-100"
                  href={`/courses/${id}/enroll`}
                >
                  Enroll Now - ${price}/month
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                  href={`/courses/${id}/preview`}
                >
                  Try Free Preview
                </Button>
              </div>
            )}
          </div>
          
          {/* Course Video Preview */}
          <div className="w-full md:w-1/2">
            <div className="rounded-xl overflow-hidden shadow-lg">
              {introVideoId ? (
                <VideoPlayer
                  videoId={introVideoId}
                  title={`${title} - Preview`}
                />
              ) : (
                <div className="aspect-video bg-neutral-800 relative">
                  <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-80 rounded-full p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseHeader;
