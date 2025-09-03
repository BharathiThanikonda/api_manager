import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase } from '../../../lib/supabase';

export const withAuth = (handler) => {
  return async (req, res) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session || !session.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user ID from email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userError || !user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user ID to request
      req.userId = user.id;
      req.userEmail = session.user.email;
      
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

