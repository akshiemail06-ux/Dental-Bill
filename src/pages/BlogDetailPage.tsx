import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, Clock, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ensureDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
  createdAt: any;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const q = query(
      collection(db, 'blogs'), 
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const blogData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as BlogPost;
        setBlog(blogData);
        
        // Update document metadata if provided
        if (blogData.metaTitle || blogData.title) {
          document.title = `${blogData.metaTitle || blogData.title} | Instant Dental Bill`;
        }
        
        if (blogData.metaDescription || blogData.excerpt) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', blogData.metaDescription || blogData.excerpt);
          } else {
            const meta = document.createElement('meta');
            meta.name = "description";
            meta.content = blogData.metaDescription || blogData.excerpt;
            document.head.appendChild(meta);
          }
        }

        if (blogData.metaKeywords) {
          const metaKey = document.querySelector('meta[name="keywords"]');
          if (metaKey) {
            metaKey.setAttribute('content', blogData.metaKeywords);
          } else {
            const meta = document.createElement('meta');
            meta.name = "keywords";
            meta.content = blogData.metaKeywords;
            document.head.appendChild(meta);
          }
        }
      } else {
        setBlog(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-20 px-4">
          <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse mb-4" />
          <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse mb-12" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!blog) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-32 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you are looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <article className="bg-white min-h-screen pb-20">
        {/* Post Header */}
        <div className="bg-gray-50 border-b border-gray-100 py-16 mb-12 relative overflow-hidden">
          {blog.featuredImage && (
            <div className="absolute inset-0 z-0 opacity-10">
              <img src={blog.featuredImage} alt="" className="w-full h-full object-cover blur-2xl" />
            </div>
          )}
          
          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <Link to="/blog" className="inline-flex items-center text-sm font-bold text-blue-600 mb-8 hover:translate-x-[-4px] transition-transform">
              <ChevronLeft size={16} className="mr-1" /> Back to all articles
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {blog.featuredImage && (
                <div className="rounded-3xl overflow-hidden shadow-2xl mb-12 aspect-[21/9]">
                  <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" />
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight font-heading">
                {blog.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  {blog.createdAt ? format(ensureDate(blog.createdAt), 'MMMM dd, yyyy') : 'Recently'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  {Math.ceil(blog.content.split(' ').length / 200)} min read
                </div>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Share2 size={16} />
                  Share Article
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Post Content */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="prose prose-lg prose-blue max-w-none">
            <div className="markdown-body">
              <ReactMarkdown>{blog.content}</ReactMarkdown>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-100">
            <div className="bg-blue-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to streamline your clinic?</h3>
                <p className="text-gray-600">Join hundreds of dental professionals using Instant Dental Bill.</p>
              </div>
              <Link to="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-blue-100">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </AppLayout>
  );
}
