import { withAuth } from '../../middleware/auth';
import { supabase } from '../../../../lib/supabase';

const handleGet = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handlePut = async (req, res) => {
  try {
    const { name, image_url } = req.body;

    const updateData = {
      name: name || undefined,
      image_url: image_url || undefined,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withAuth(handler);

