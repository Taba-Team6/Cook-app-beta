import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Helper function to create auth client
export function createAuthClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Helper function to verify user
export async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'No authorization token provided', user: null };
  }

  const supabase = createAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }

  return { error: null, user };
}

// ============================================
// AUTH ROUTES
// ============================================

export function authRoutes() {
  const router = new Hono();

  // Sign up
  router.post('/signup', async (c) => {
    try {
      const { email, password, name } = await c.req.json();

      if (!email || !password || !name) {
        return c.json({ error: 'Email, password, and name are required' }, 400);
      }

      const supabase = createAuthClient();
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true,
      });

      if (error) {
        console.log('Signup error:', error);
        return c.json({ error: error.message }, 400);
      }

      if (!data.user) {
        return c.json({ error: 'Failed to create user' }, 500);
      }

      // Initialize user profile in KV store
      await kv.set(`users:${data.user.id}:profile`, {
        id: data.user.id,
        email,
        name,
        createdAt: new Date().toISOString(),
      });

      // Initialize empty ingredients list
      await kv.set(`users:${data.user.id}:ingredients`, []);

      // Initialize empty saved recipes list
      await kv.set(`users:${data.user.id}:saved_recipes`, []);

      return c.json({
        success: true,
        user: {
          id: data.user.id,
          email,
          name,
        },
      });
    } catch (error) {
      console.log('Signup error in catch block:', error);
      return c.json({ error: 'Internal server error during signup' }, 500);
    }
  });

  return router;
}

// ============================================
// USER PROFILE ROUTES
// ============================================

export function profileRoutes() {
  const router = new Hono();

  // Get user profile
  router.get('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const profile = await kv.get(`users:${user.id}:profile`);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      return c.json({ profile });
    } catch (error) {
      console.log('Error fetching profile:', error);
      return c.json({ error: 'Failed to fetch profile' }, 500);
    }
  });

  // Update user profile
  router.put('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const profileData = await c.req.json();
      
      // Get existing profile
      const existingProfile = await kv.get(`users:${user.id}:profile`);
      
      // Merge with new data
      const updatedProfile = {
        ...existingProfile,
        ...profileData,
        id: user.id,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`users:${user.id}:profile`, updatedProfile);

      return c.json({ profile: updatedProfile });
    } catch (error) {
      console.log('Error updating profile:', error);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  });

  return router;
}

// ============================================
// INGREDIENTS ROUTES
// ============================================

export function ingredientsRoutes() {
  const router = new Hono();

  // Get all ingredients for user
  router.get('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const ingredients = await kv.get(`users:${user.id}:ingredients`) || [];
      return c.json({ ingredients });
    } catch (error) {
      console.log('Error fetching ingredients:', error);
      return c.json({ error: 'Failed to fetch ingredients' }, 500);
    }
  });

  // Add ingredient
  router.post('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const ingredientData = await c.req.json();
      
      // Get existing ingredients
      const ingredients = await kv.get(`users:${user.id}:ingredients`) || [];
      
      // Create new ingredient with ID
      const newIngredient = {
        id: crypto.randomUUID(),
        ...ingredientData,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      // Add to list
      ingredients.push(newIngredient);
      
      await kv.set(`users:${user.id}:ingredients`, ingredients);

      return c.json({ ingredient: newIngredient });
    } catch (error) {
      console.log('Error adding ingredient:', error);
      return c.json({ error: 'Failed to add ingredient' }, 500);
    }
  });

  // Update ingredient
  router.put('/:id', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const ingredientId = c.req.param('id');
      const updateData = await c.req.json();
      
      // Get existing ingredients
      const ingredients = await kv.get(`users:${user.id}:ingredients`) || [];
      
      // Find and update ingredient
      const index = ingredients.findIndex((ing: any) => ing.id === ingredientId);
      
      if (index === -1) {
        return c.json({ error: 'Ingredient not found' }, 404);
      }

      ingredients[index] = {
        ...ingredients[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      await kv.set(`users:${user.id}:ingredients`, ingredients);

      return c.json({ ingredient: ingredients[index] });
    } catch (error) {
      console.log('Error updating ingredient:', error);
      return c.json({ error: 'Failed to update ingredient' }, 500);
    }
  });

  // Delete ingredient
  router.delete('/:id', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const ingredientId = c.req.param('id');
      
      // Get existing ingredients
      const ingredients = await kv.get(`users:${user.id}:ingredients`) || [];
      
      // Filter out the ingredient
      const filteredIngredients = ingredients.filter((ing: any) => ing.id !== ingredientId);
      
      if (ingredients.length === filteredIngredients.length) {
        return c.json({ error: 'Ingredient not found' }, 404);
      }
      
      await kv.set(`users:${user.id}:ingredients`, filteredIngredients);

      return c.json({ success: true });
    } catch (error) {
      console.log('Error deleting ingredient:', error);
      return c.json({ error: 'Failed to delete ingredient' }, 500);
    }
  });

  return router;
}

// ============================================
// SAVED RECIPES ROUTES
// ============================================

export function savedRecipesRoutes() {
  const router = new Hono();

  // Get saved recipes
  router.get('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const savedRecipes = await kv.get(`users:${user.id}:saved_recipes`) || [];
      return c.json({ recipes: savedRecipes });
    } catch (error) {
      console.log('Error fetching saved recipes:', error);
      return c.json({ error: 'Failed to fetch saved recipes' }, 500);
    }
  });

  // Save recipe
  router.post('/', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const recipeData = await c.req.json();
      
      // Get existing saved recipes
      const savedRecipes = await kv.get(`users:${user.id}:saved_recipes`) || [];
      
      // Check if recipe is already saved
      const existingIndex = savedRecipes.findIndex((r: any) => r.id === recipeData.id);
      
      if (existingIndex !== -1) {
        return c.json({ error: 'Recipe already saved' }, 400);
      }

      // Add to list
      const savedRecipe = {
        ...recipeData,
        savedAt: new Date().toISOString(),
      };
      
      savedRecipes.push(savedRecipe);
      
      await kv.set(`users:${user.id}:saved_recipes`, savedRecipes);

      return c.json({ recipe: savedRecipe });
    } catch (error) {
      console.log('Error saving recipe:', error);
      return c.json({ error: 'Failed to save recipe' }, 500);
    }
  });

  // Remove saved recipe
  router.delete('/:id', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const recipeId = c.req.param('id');
      
      // Get existing saved recipes
      const savedRecipes = await kv.get(`users:${user.id}:saved_recipes`) || [];
      
      // Filter out the recipe
      const filteredRecipes = savedRecipes.filter((r: any) => r.id !== recipeId);
      
      if (savedRecipes.length === filteredRecipes.length) {
        return c.json({ error: 'Recipe not found' }, 404);
      }
      
      await kv.set(`users:${user.id}:saved_recipes`, filteredRecipes);

      return c.json({ success: true });
    } catch (error) {
      console.log('Error removing saved recipe:', error);
      return c.json({ error: 'Failed to remove saved recipe' }, 500);
    }
  });

  return router;
}