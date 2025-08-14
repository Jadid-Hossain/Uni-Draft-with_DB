import { useState, useEffect } from 'react'
import { supabase, type Event, type Club, type Resource } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

// Custom hook for Events
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_at', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  // Create event
  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('User must be authenticated')

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      
      setEvents(prev => [...prev, data])
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create event')
    }
  }

  // Update event
  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setEvents(prev => prev.map(event => event.id === id ? data : event))
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update event')
    }
  }

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete event')
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  }
}

// Custom hook for Clubs
export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch clubs
  const fetchClubs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClubs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clubs')
    } finally {
      setLoading(false)
    }
  }

  // Create club
  const createClub = async (clubData: Omit<Club, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('User must be authenticated')

    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert({
          ...clubData,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      
      setClubs(prev => [data, ...prev])
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create club')
    }
  }

  // Update club
  const updateClub = async (id: string, updates: Partial<Club>) => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setClubs(prev => prev.map(club => club.id === id ? data : club))
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update club')
    }
  }

  // Delete club
  const deleteClub = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setClubs(prev => prev.filter(club => club.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete club')
    }
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  return {
    clubs,
    loading,
    error,
    createClub,
    updateClub,
    deleteClub,
    refetch: fetchClubs
  }
}

// Custom hook for Resources
export function useResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch resources
  const fetchResources = async (filters?: {
    category?: string
    subject?: string
    course_code?: string
    search?: string
  }) => {
    try {
      setLoading(true)
      console.log('DEBUG: Fetching resources from database...')
      
      let query = supabase
        .from('resources')
        .select('*')  // Simplified query without join
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category)
      }
      if (filters?.subject && filters.subject !== 'All') {
        query = query.eq('subject', filters.subject)
      }
      if (filters?.course_code && filters.course_code !== 'All') {
        query = query.eq('course_code', filters.course_code)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      console.log('DEBUG: Raw query result:', { data, error })

      if (error) {
        console.error('DEBUG: Database query error:', error)
        throw error
      }
      
      console.log('DEBUG: Successfully fetched resources:', data?.length || 0)
      setResources(data || [])
    } catch (err) {
      console.error('DEBUG: Fetch resources error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch resources')
    } finally {
      setLoading(false)
    }
  }

  // Upload resource file to Supabase storage
  const uploadResourceFile = async (file: File, fileName: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('resources')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return data.path
  }

  // Create resource
  const createResource = async (resourceData: {
    title: string
    description?: string
    category: string
    subject?: string
    course_code?: string
    tags?: string[]
    file: File
  }) => {
    if (!user) throw new Error('User must be authenticated')

    try {
      console.log('DEBUG: User object:', user)
      console.log('DEBUG: User ID:', user.id)
      console.log('DEBUG: Resource data:', resourceData)

      // Set session context for RLS (try-catch to handle if function doesn't exist)
      try {
        await supabase.rpc('set_session_context', { user_id: user.id })
        console.log('DEBUG: Session context set successfully')
      } catch (contextError) {
        console.warn('Session context not available, continuing with direct insert', contextError)
      }

      // SKIP FILE UPLOAD FOR NOW - Use dummy path
      const filePath = `debug/${Date.now()}_${resourceData.file.name}`
      console.log('DEBUG: Using dummy file path:', filePath)

      // Create resource record with only the fields that exist in the original schema
      const insertData: any = {
        title: resourceData.title,
        description: resourceData.description,
        file_path: filePath,
        uploaded_by: user.id
      }

      // Only add new fields if they exist in the schema (after migration)
      if (resourceData.category) insertData.category = resourceData.category
      if (resourceData.subject) insertData.subject = resourceData.subject
      if (resourceData.course_code) insertData.course_code = resourceData.course_code
      if (resourceData.tags) insertData.tags = resourceData.tags
      if (resourceData.file.size) insertData.file_size = resourceData.file.size
      if (resourceData.file.type) insertData.file_type = resourceData.file.type

      console.log('DEBUG: Insert data:', insertData)

      const { data, error } = await supabase
        .from('resources')
        .insert(insertData)
        .select()
        .single()

      console.log('DEBUG: Supabase response:', { data, error })

      if (error) throw error
      
      console.log('DEBUG: Upload successful, adding to resources list:', data)
      setResources(prev => [data, ...prev])
      
      // Also trigger a refetch to make sure we have the latest data
      setTimeout(() => {
        fetchResources()
      }, 100)
      
      return data
    } catch (err) {
      console.error('DEBUG: Full error:', err)
      throw err instanceof Error ? err : new Error('Failed to create resource')
    }
  }

  // Download resource
  const downloadResource = async (resource: Resource) => {
    try {
      // Increment download count
      await supabase
        .from('resources')
        .update({ download_count: (resource.download_count || 0) + 1 })
        .eq('id', resource.id)

      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(resource.file_path, 60 * 60) // 1 hour expiry

      if (error) throw error

      // Trigger download
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = resource.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Update local state
      setResources(prev => 
        prev.map(r => 
          r.id === resource.id 
            ? { ...r, download_count: (r.download_count || 0) + 1 }
            : r
        )
      )
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to download resource')
    }
  }

  // Delete resource
  const deleteResource = async (id: string, filePath: string) => {
    try {
      // Delete file from storage
      await supabase.storage
        .from('resources')
        .remove([filePath])

      // Delete resource record
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setResources(prev => prev.filter(resource => resource.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete resource')
    }
  }

  // Get resource preview URL
  const getResourcePreviewUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('resources')
      .createSignedUrl(filePath, 60 * 15) // 15 minutes for preview

    if (error) throw error
    return data.signedUrl
  }

  useEffect(() => {
    fetchResources()
  }, [])

  return {
    resources,
    loading,
    error,
    createResource,
    deleteResource,
    downloadResource,
    getResourcePreviewUrl,
    refetch: fetchResources
  }
}

