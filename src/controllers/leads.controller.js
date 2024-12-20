const { PrismaClient } = require("@prisma/client");
const prismaClient = new PrismaClient();
const { sendWebhook } = require("../utils/sendWebhook");
const getLeads = async (req, res) => {
  const leads = await prismaClient.lead.findMany();
  res.json(leads);
};

const addLead = async (req, res) => {
  const data = req.body;

  const {
    firstName,
    lastName,
    phone,
    email,
    address,
    status,
    sub1,
    sub2,
    sub3,
    sub4,
    campId,
    apiKey,
  } = data;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!apiKey) {
    return res.status(400).json({ error: "Missing API key" });
  }

  if (!campId) {
    return res.status(400).json({ error: "Missing campaign ID" });
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        apiKey,
      },
    });

    if (!user) {
      throw new Error("Invalid API key");
    }
    const camp = await prismaClient.campaign.findFirst({
      where: {
        campId,
        userId: user.id,
      },
      include: {
        route: true,
      },
    });
    if (!camp) {
      throw new Error("Campaign not found");
    }
    const route = camp.route;
    if (!route) {
      throw new Error("Route not found");
    }

    const lead = await prismaClient.lead.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
        status,
        sub1,
        sub2,
        sub3,
        sub4,
        campaignId: camp.id,
        routeId: camp.routeId,
        userId: user.id,
      },
    });

    if (!lead) {
      throw new Error("Unable to create lead");
    }

    // #TODO get route and sent lead (webhook)
    console.log("route", route);
    const webhookResponse = await sendWebhook(route, lead);
    console.log(webhookResponse);
    res.status(201).json(webhookResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLeadsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const leads = await prismaClient.lead.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        date: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        sub1: true,
        sub2: true,
        sub3: true,
        sub4: true,
        campaignId: true,
        routeId: true,
        userId: true,
      },
    });
    console.log("leads by user id", leads);
    res.json(leads);
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ error: "Unable to get leads", details: error.message });
  }
};

module.exports = {
  getLeads,
  addLead,
  getLeadsByUser,
};
