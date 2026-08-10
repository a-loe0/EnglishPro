import { Request, Response, NextFunction } from 'express';
import { getDashboardService } from '../services/dashboard.service';

export class DashboardController {
  /**
   * GET /api/dashboard/teacher - Get teacher dashboard data
   */
  async getTeacherDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      if (user.role !== 'TEACHER') {
        res.status(403).json({ error: 'Only teachers can access this endpoint' });
        return;
      }

      const dashboardService = getDashboardService();
      const dashboard = await dashboardService.getTeacherDashboard(user.userId);

      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/student - Get student dashboard data
   */
  async getStudentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      if (user.role !== 'STUDENT') {
        res.status(403).json({ error: 'Only students can access this endpoint' });
        return;
      }

      const dashboardService = getDashboardService();
      const dashboard = await dashboardService.getStudentDashboard(user.userId);

      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const dashboardController = new DashboardController();
export default dashboardController;
