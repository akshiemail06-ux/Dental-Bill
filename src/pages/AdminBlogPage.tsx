import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  FileText,
  AlertCircle,
  ImageIcon,
  Copy,
  Upload,
  Loader2,
  Globe,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ensureDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  featuredImage: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: any;
  updatedAt?: any;
}

const ADMIN_EMAIL = "akshiemail06@gmail.com";

export default function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    featuredImage: '',
    excerpt: '',
    content: '',
    status: 'draft',
    createdAt: null
  });

  const [uploading, setUploading] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState('');
  const [imgAltText, setImgAltText] = useState('');

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      setBlogs(blogsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-generate slug from title if slug is empty or matches previous title slug
      if (name === 'title' && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
        newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return newData;
    });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200; // Resize to max 1200px width/height
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            },
            'image/jpeg',
            0.7 // 70% quality for best balance of speed and visual clarity
          );
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  // Image Upload Utility for Blog Content (Base64 fallback as Storage is disabled)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Optimizing and processing image...');

    try {
      // Compress image before conversion
      const compressedBlob = await compressImage(file);
      
      // Convert to base64 instead of uploading to Firebase Storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });

      const base64Url = await base64Promise;

      // Check size - Firestore has a 1MB limit per document
      if (base64Url.length > 800000) { // Safety margin
        toast.error('Image is too large for database storage even after compression. Please use a smaller image or an external URL.', { id: toastId });
        return;
      }

      setLastUploadedUrl(base64Url);
      toast.success('Image optimized & converted to base64 successfully', { id: toastId });
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const copyMarkdown = (url: string) => {
    const markdown = `![${imgAltText || 'image'}](${url})`;
    navigator.clipboard.writeText(markdown);
    toast.success('Markdown snippet copied!');
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as 'draft' | 'published' }));
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'draft' | 'published') => {
    if (e) e.preventDefault();
    
    const finalStatus = statusOverride || formData.status;
    
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        status: finalStatus,
        updatedAt: Timestamp.now()
      };

      if (currentBlog?.id) {
        // Update
        const blogRef = doc(db, 'blogs', currentBlog.id);
        await updateDoc(blogRef, dataToSave);
        toast.success(`Blog post ${finalStatus === 'published' ? 'published' : 'saved as draft'}`);
      } else {
        // Create
        await addDoc(collection(db, 'blogs'), {
          ...dataToSave,
          createdAt: Timestamp.now()
        });
        toast.success(`Blog post ${finalStatus === 'published' ? 'published' : 'saved as draft'}`);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog post');
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData(blog);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteDoc(doc(db, 'blogs', id));
        toast.success('Blog post deleted');
      } catch (error) {
        toast.error('Failed to delete blog post');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      featuredImage: '',
      excerpt: '',
      content: '',
      status: 'draft',
      createdAt: null
    });
    setCurrentBlog(null);
    setIsEditing(false);
    setLastUploadedUrl('');
    setImgAltText('');
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Blog Management</h1>
            <p className="text-gray-500">Create and publish articles for your website</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-100">
              <Plus className="mr-2 h-5 w-5" /> New Post
            </Button>
          )}
        </div>

        {isEditing && (
          <Card className="mb-12 border-none shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">{currentBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm} className="rounded-full">
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={12} className="text-blue-500" /> Title *
                    </label>
                    <Input 
                      name="title" 
                      value={formData.title} 
                      onChange={handleInputChange} 
                      placeholder="Enter blog title"
                      className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} className="text-blue-500" /> Slug * (URL path)
                    </label>
                    <Input 
                      name="slug" 
                      value={formData.slug} 
                      onChange={handleInputChange} 
                      placeholder="blog-post-slug"
                      className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={12} className="text-blue-500" /> Featured Image URL
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        name="featuredImage" 
                        value={formData.featuredImage} 
                        onChange={handleInputChange} 
                        placeholder="https://..."
                        className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                      />
                      {formData.featuredImage && (
                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                          <img src={formData.featuredImage} alt="Featured" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} className="text-blue-500" /> Meta Keywords
                    </label>
                    <Input 
                      name="metaKeywords" 
                      value={formData.metaKeywords} 
                      onChange={handleInputChange} 
                      placeholder="SEO Keywords (comma separated)"
                      className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} className="text-blue-500" /> Meta Title
                    </label>
                    <Input 
                      name="metaTitle" 
                      value={formData.metaTitle} 
                      onChange={handleInputChange} 
                      placeholder="SEO Title (leave empty to use main title)"
                      className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} className="text-blue-500" /> Meta Description
                    </label>
                    <Input 
                      name="metaDescription" 
                      value={formData.metaDescription} 
                      onChange={handleInputChange} 
                      placeholder="SEO Description"
                      className="h-12 rounded-xl border-gray-200 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Excerpt (Short summary)</label>
                  <Textarea 
                    name="excerpt" 
                    value={formData.excerpt} 
                    onChange={handleInputChange} 
                    placeholder="Brief summary of the blog post for indexing and listing..."
                    rows={2}
                    className="rounded-xl border-gray-200 resize-none focus:ring-blue-500"
                  />
                </div>

                {/* Image Upload Utility for Blog Content */}
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <ImageIcon size={16} /> Blog Content Image Helper
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">1. Upload Image</label>
                         <div className="relative">
                            <input 
                              type="file" 
                              id="blog-img-upload" 
                              className="hidden" 
                              onChange={handleImageUpload}
                              accept="image/*"
                            />
                            <label 
                              htmlFor="blog-img-upload" 
                              className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-100/50 cursor-pointer transition-all"
                            >
                              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                              {uploading ? 'Uploading...' : 'Choose Image'}
                            </label>
                         </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">2. Get Markdown Code</label>
                         <div className="flex gap-2">
                            <Input 
                              placeholder="Alt text (SEO)" 
                              value={imgAltText}
                              onChange={(e) => setImgAltText(e.target.value)}
                              className="h-11 rounded-xl bg-white"
                            />
                            <Button 
                              type="button"
                              disabled={!lastUploadedUrl} 
                              onClick={() => copyMarkdown(lastUploadedUrl)}
                              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Copy size={18} />
                            </Button>
                         </div>
                         {lastUploadedUrl && (
                           <p className="text-[10px] text-green-600 font-medium animate-pulse">
                             Image ready! Type alt text and copy code.
                           </p>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Content (Markdown supported) *</label>
                  <Textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                    placeholder="Write your blog content here... Use the helper above to insert images."
                    rows={15}
                    className="rounded-xl border-gray-200 font-mono text-sm focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status:</label>
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1 md:flex-none h-11 px-6 rounded-xl border-gray-200">
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={(e) => handleSubmit(e as any, 'draft')} 
                      className="flex-1 md:flex-none h-11 px-6 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save Draft
                    </Button>
                    <Button 
                      type="button"
                      onClick={(e) => handleSubmit(e as any, 'published')} 
                      className="flex-1 md:flex-none h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
                    >
                      <FileText className="mr-2 h-4 w-4" /> {currentBlog ? 'Update Post' : 'Publish Post'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Existing Posts</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No blog posts found. Create your first post!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {blogs.map((blog) => (
                <Card key={blog.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{blog.title}</h3>
                        <Badge variant={blog.status === 'published' ? 'default' : 'secondary'} className={
                          blog.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                        }>
                          {blog.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {blog.createdAt ? format(ensureDate(blog.createdAt), 'MMM dd, yyyy') : 'No date'} • /{blog.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}>
                        <Eye size={18} className="text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(blog)}>
                        <Edit size={18} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => blog.id && handleDelete(blog.id)}>
                        <Trash2 size={18} className="text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
