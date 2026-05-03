import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, ChevronRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, ensureDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  createdAt: any;
}

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'blogs'), 
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      setBlogs(blogsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppLayout>
      <div className="bg-white min-h-screen">
        {/* Hero Section */}
        <div className="bg-gray-50 border-b border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4 font-heading">Clinic Insights & Dental Tips</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stay updated with the latest in dental technology, clinic management tips, and professional billing practices.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto py-16 px-4">
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">No articles yet</h2>
              <p className="text-gray-500">Check back soon for fresh content!</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {blogs.map((blog, idx) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link to={`/blog/${blog.slug}`}>
                    <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden rounded-3xl">
                      <div className="flex flex-col md:flex-row h-full">
                        {blog.featuredImage && (
                          <div className="md:w-2/5 h-48 md:h-auto overflow-hidden">
                            <img 
                              src={blog.featuredImage} 
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          </div>
                        )}
                        <CardContent className={cn("p-8 flex flex-col h-full", blog.featuredImage ? "md:w-3/5" : "w-full")}>
                          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
                            <Calendar size={14} />
                            {blog.createdAt ? format(ensureDate(blog.createdAt), 'MMMM dd, yyyy') : 'Recently'}
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors font-heading">
                            {blog.title}
                          </h2>
                          <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                            {blog.excerpt || "Read our latest article to learn more about dental clinic management and billing excellence."}
                          </p>
                          <div className="mt-auto flex items-center text-blue-600 font-bold text-sm">
                            Read Full Article <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
