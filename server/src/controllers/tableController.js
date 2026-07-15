import { validationResult } from 'express-validator';
import Table from '../models/Table.js';

export const getAllTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableNumber, capacity } = req.body;

    const table = await Table.create({ tableNumber, capacity });

    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const { capacity, status } = req.body;

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { capacity, status },
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({
      success: true,
      message: 'Table deleted',
    });
  } catch (error) {
    next(error);
  }
};
