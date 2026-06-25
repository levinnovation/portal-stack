/**
 * AI agent tools. Each tool is a function the model can call; it returns
 * a JSON-serialisable result. Tools are role-scoped where appropriate.
 *
 * Conventions:
 *  - Tools return objects, not strings, so the model can pick fields.
 *  - Errors are caught and returned as { error: string } so the model
 *    can surface them gracefully instead of crashing the stream.
 *  - List tools respect per-user data scoping via Payload's where clause.
 */

import { tool } from "ai";
import { z } from "zod";
import type { Payload } from "payload";
import type { SessionUser } from "../../auth/provider";
import {
  customerIdForUser,
  investmentIdsForInvestors,
  investorIdsForUser,
  isStaffRole,
  projectIdsForCustomer,
  projectIdsForInvestors,
} from "../scoping";

const isAdmin = (u: SessionUser) => isStaffRole(u.role);

export function buildTools(payload: Payload, user: SessionUser) {
  return {
    list_projects: tool({
      description: "List real-estate projects. Filter by status or limit count.",
      inputSchema: z.object({
        status: z.enum(["planning", "pre_construction", "construction", "completed"]).optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }) => {
        try {
          const where: any = status ? { projectStatus: { equals: status } } : {};
          if (!isStaffRole(user.role)) {
            if (user.role === "investor") {
              const projectIds = await projectIdsForInvestors(payload, await investorIdsForUser(payload, user.id));
              if (!projectIds.length) return { total: 0, projects: [] };
              where.id = { in: projectIds };
            } else if (user.role === "customer") {
              const customerId = await customerIdForUser(payload, user.id);
              if (!customerId) return { total: 0, projects: [] };
              const projectIds = await projectIdsForCustomer(payload, customerId);
              if (!projectIds.length) return { total: 0, projects: [] };
              where.id = { in: projectIds };
            } else {
              return { error: "forbidden" };
            }
          }
          const r = await payload.find({
            collection: "projects",
            where: Object.keys(where).length ? where : undefined,
            limit,
            sort: "-createdAt",
            depth: 0,
            overrideAccess: true,
          });
          return {
            total: r.totalDocs,
            projects: (r.docs as any[]).map((p) => ({
              id: p.id,
              name: p.name,
              status: p.projectStatus,
              location: p.location,
              totalUnits: p.totalUnits,
              budgetTotal: p.budgetTotal,
              estimatedDelivery: p.estimatedDelivery,
            })),
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to list projects" };
        }
      },
    }),

    get_project: tool({
      description: "Get a single project by id or name.",
      inputSchema: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
      }),
      execute: async ({ id, name }) => {
        try {
          if (!id && !name) return { error: "Provide id or name" };
          const r = id
            ? await payload.findByID({ collection: "projects", id, depth: 1, overrideAccess: true }).catch(() => null)
            : await payload.find({
                collection: "projects",
                where: { name: { like: name! } },
                limit: 1,
                depth: 1,
                overrideAccess: true,
              });
          const project = id ? r : (r as any).docs[0];
          if (!project) return { error: "Project not found" };
          if (!isStaffRole(user.role)) {
            const projectId = String((project as any).id);
            if (user.role === "investor") {
              const allowed = await projectIdsForInvestors(payload, await investorIdsForUser(payload, user.id));
              if (!allowed.includes(projectId)) return { error: "forbidden" };
            } else if (user.role === "customer") {
              const customerId = await customerIdForUser(payload, user.id);
              if (!customerId) return { error: "forbidden" };
              const allowed = await projectIdsForCustomer(payload, customerId);
              if (!allowed.includes(projectId)) return { error: "forbidden" };
            } else {
              return { error: "forbidden" };
            }
          }
          return project;
        } catch (e: any) {
          return { error: e?.message || "Failed to get project" };
        }
      },
    }),

    list_investors: tool({
      description: "List investors. Admin-only.",
      inputSchema: z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ limit }) => {
        if (!isAdmin(user)) return { error: "forbidden" };
        try {
          const r = await payload.find({
            collection: "investors",
            limit,
            sort: "-createdAt",
            depth: 0,
            overrideAccess: true,
          });
          return { total: r.totalDocs, investors: r.docs };
        } catch (e: any) {
          return { error: e?.message || "Failed to list investors" };
        }
      },
    }),

    get_investor_portfolio: tool({
      description: "Get the portfolio (investments, distributions, capital totals) for an investor. Admin can pass any id; investor users only see their own.",
      inputSchema: z.object({
        investorId: z.string().optional(),
      }),
      execute: async ({ investorId }) => {
        try {
          let ids: string[] = [];
          if (investorId) {
            if (!isAdmin(user)) return { error: "forbidden" };
            ids = [investorId];
          } else {
            const r = await payload.find({
              collection: "investors",
              where: { user: { equals: user.id } },
              limit: 10,
              depth: 0,
              overrideAccess: true,
            });
            ids = (r.docs as any[]).map((d) => d.id);
          }
          if (!ids.length) return { error: "No investor record for this user" };
          const inv = await payload.find({
            collection: "investments",
            where: { investor: { in: ids } },
            limit: 500,
            depth: 1,
            overrideAccess: true,
          });
          const investmentIds = (inv.docs as any[]).map((i) => i.id);
          const dist = investmentIds.length
            ? await payload.find({
                collection: "distributions",
                where: { investment: { in: investmentIds } },
                limit: 1000,
                depth: 0,
                overrideAccess: true,
              })
            : { docs: [] };
          const totalInvested = (inv.docs as any[]).reduce((s, i) => s + Number(i.amountInvested || 0), 0);
          const totalDistributions = (dist.docs as any[]).reduce((s, d) => s + Number(d.amount || 0), 0);
          return {
            totalInvested,
            totalDistributions,
            roi: totalInvested > 0 ? (totalDistributions / totalInvested) * 100 : 0,
            investments: (inv.docs as any[]).map((i) => ({
              id: i.id,
              project: i.project?.name,
              amountInvested: i.amountInvested,
              investmentDate: i.investmentDate,
              type: i.investmentType,
            })),
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to get portfolio" };
        }
      },
    }),

    list_distributions: tool({
      description: "List recent distributions (payouts).",
      inputSchema: z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ limit }) => {
        try {
          const where: any = {};
          if (!isStaffRole(user.role)) {
            if (user.role !== "investor") return { error: "forbidden" };
            const investmentIds = await investmentIdsForInvestors(payload, await investorIdsForUser(payload, user.id));
            if (!investmentIds.length) return { total: 0, distributions: [] };
            where.investment = { in: investmentIds };
          }
          const r = await payload.find({
            collection: "distributions",
            where: Object.keys(where).length ? where : undefined,
            limit,
            sort: "-distributionDate",
            depth: 1,
            overrideAccess: true,
          });
          return { total: r.totalDocs, distributions: r.docs };
        } catch (e: any) {
          return { error: e?.message || "Failed to list distributions" };
        }
      },
    }),

    list_payments: tool({
      description: "List recent payments. Admin sees all; customers see their own.",
      inputSchema: z.object({
        status: z.enum(["pending", "paid", "overdue"]).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        try {
          const where: any = {};
          if (status) where.status = { equals: status };
          if (!isStaffRole(user.role)) {
            if (user.role !== "customer") return { error: "forbidden" };
            const customerId = await customerIdForUser(payload, user.id);
            if (!customerId) return { total: 0, payments: [] };
            where.customer = { equals: customerId };
          }
          const r = await payload.find({
            collection: "payments",
            where: Object.keys(where).length ? where : undefined,
            limit,
            sort: "-dueDate",
            depth: 1,
            overrideAccess: true,
          });
          return { total: r.totalDocs, payments: r.docs };
        } catch (e: any) {
          return { error: e?.message || "Failed to list payments" };
        }
      },
    }),

    get_customer_unit: tool({
      description: "Get the current customer's unit and progress summary.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const cust = await payload.find({
            collection: "customers",
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 1,
            overrideAccess: true,
          });
          const customer = (cust.docs as any[])[0];
          if (!customer) return { error: "No customer record" };
          const sales = await payload.find({
            collection: "sales",
            where: { customer: { equals: customer.id } },
            limit: 5,
            depth: 2,
            overrideAccess: true,
          });
          return { customer, sales: sales.docs };
        } catch (e: any) {
          return { error: e?.message || "Failed to get unit" };
        }
      },
    }),

    list_documents: tool({
      description: "List documents visible to the current user.",
      inputSchema: z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ entityType, entityId, limit }) => {
        try {
          const where: any = {};
          if (entityType) where.entityType = { equals: entityType };
          if (entityId) where.entityId = { equals: entityId };
          if (!isAdmin(user)) {
            where.or = [
              { uploadedBy: { equals: user.id } },
              { visibility: { equals: "all_users" } },
              { visibility: { equals: user.role } },
            ];
          }
          const r = await payload.find({
            collection: "documents",
            where,
            limit,
            sort: "-createdAt",
            depth: 0,
            overrideAccess: true,
          });
          return { total: r.totalDocs, documents: r.docs };
        } catch (e: any) {
          return { error: e?.message || "Failed to list documents" };
        }
      },
    }),

    portfolio_kpis: tool({
      description: "Compute high-level portfolio KPIs (totals, counts) across projects, investors, payments.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!isStaffRole(user.role)) return { error: "forbidden" };
        try {
          const [projects, investors, customers, payments] = await Promise.all([
            payload.find({ collection: "projects", limit: 0, overrideAccess: true }),
            payload.find({ collection: "investors", limit: 0, overrideAccess: true }),
            payload.find({ collection: "customers", limit: 0, overrideAccess: true }),
            payload.find({ collection: "payments", limit: 0, overrideAccess: true }),
          ]);
          const investments = await payload.find({ collection: "investments", limit: 1000, depth: 0, overrideAccess: true });
          const totalCapital = (investments.docs as any[]).reduce((s, i) => s + Number(i.amountInvested || 0), 0);
          const overdue = await payload.find({ collection: "payments", where: { status: { equals: "overdue" } }, limit: 0, overrideAccess: true });
          return {
            projects: projects.totalDocs,
            investors: investors.totalDocs,
            customers: customers.totalDocs,
            payments: payments.totalDocs,
            overduePayments: overdue.totalDocs,
            totalCapitalCommitted: totalCapital,
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to compute KPIs" };
        }
      },
    }),
  };
}
